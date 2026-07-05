#!/usr/bin/env python3
"""Black-box smoke checks for the public site and local admin shell.

Configuration:
  SITE_URL=http://127.0.0.1:4322 npm run test:smoke
  SMOKE_FORBIDDEN_TEXT="secret1,secret2" npm run test:smoke
  SNAPSHOT_DATE=2026-07-04 npm run test:smoke
"""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
import playwright as playwright_package


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "http://127.0.0.1:4322"
DEFAULT_FORBIDDEN = ("sk-", "api_key=", "BEGIN PRIVATE KEY", "/Users/")
RAW_TEXT_PATTERNS = (
    re.compile(r"---\s*\ntitle:", re.IGNORECASE),
    re.compile(r"AstroError|Stack trace|Traceback \(most recent call last\)", re.IGNORECASE),
    re.compile(r"\bmock data\b|\bplaceholder mock\b", re.IGNORECASE),
    re.compile(r"<html>|</html>|^\s*\{[\s\S]{40,}\}\s*$", re.IGNORECASE),
)


@dataclass(frozen=True)
class RouteSpec:
    name: str
    path: str
    selector: str = "main"
    optional: bool = False


def env_list(name: str, fallback: Iterable[str]) -> tuple[str, ...]:
    raw = os.environ.get(name)
    if raw is None:
        return tuple(fallback)
    return tuple(item.strip() for item in raw.split(",") if item.strip())


def snapshot_dir() -> Path:
    stamp = os.environ.get("SNAPSHOT_DATE") or date.today().isoformat()
    root = Path(os.environ.get("SNAPSHOT_ROOT", ROOT / "sense/reports/visual-snapshots"))
    return root / stamp / "smoke"


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip().lower())
    return cleaned.strip("-")[:80] or "route"


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def choose_routes() -> list[RouteSpec]:
    search_index = read_json(ROOT / "public/assets/search-index.json", [])
    if not isinstance(search_index, list):
        search_index = []

    def first_url(predicate, fallback: str) -> str:
        for item in search_index:
            if isinstance(item, dict) and predicate(item):
                url = item.get("url")
                if isinstance(url, str) and url.startswith("/"):
                    return url
        return fallback

    note_detail = first_url(
        lambda item: item.get("type") == "note"
        and item.get("url", "").startswith("/notes/")
        and "book" not in item.get("tags", [])
        and "canvas" not in item.get("tags", [])
        and "excalidraw" not in item.get("tags", []),
        "/notes/",
    )
    canvas_note = first_url(
        lambda item: item.get("type") == "note"
        and item.get("url", "").startswith("/notes/")
        and (
            "canvas" in item.get("tags", [])
            or str(item.get("sourcePath", "")).startswith("content/notes/canvas-")
        ),
        "/lab/canvas",
    )
    project_detail = first_url(
        lambda item: item.get("type") == "project" and item.get("url", "").startswith("/projects/"),
        "/projects/",
    )

    return [
        RouteSpec("home", "/"),
        RouteSpec("notes-index", "/notes/"),
        RouteSpec("note-detail", note_detail),
        RouteSpec("canvas-note", canvas_note),
        RouteSpec("library", "/library/"),
        RouteSpec("projects-index", "/projects/"),
        RouteSpec("project-detail", project_detail),
        RouteSpec("resume", "/resume/"),
        RouteSpec("decks", "/decks/"),
        RouteSpec("graph-lab", "/lab/graph"),
        RouteSpec("canvas-lab", "/lab/canvas"),
        RouteSpec("admin", "/admin"),
        RouteSpec("typst-lab-future", "/lab/typst", optional=True),
    ]


def page_text(page) -> str:
    return page.locator("body").inner_text(timeout=2000)


def visible_raw_text_issues(text: str) -> list[str]:
    issues = []
    for pattern in RAW_TEXT_PATTERNS:
        if pattern.search(text):
            issues.append(pattern.pattern)
    return issues


def absolute_url(base_url: str, path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))


def write_report(out_dir: Path, rows: list[dict]) -> None:
    report = out_dir / "smoke-index.md"
    lines = [
        "# Smoke Test Report",
        "",
        f"- Base URL: `{os.environ.get('SITE_URL', DEFAULT_BASE_URL)}`",
        f"- Output: `{out_dir.relative_to(ROOT) if out_dir.is_relative_to(ROOT) else out_dir}`",
        "",
        "| Status | Route | Title | Screenshot | Notes |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        screenshot = row.get("screenshot") or ""
        shot_label = Path(screenshot).name if screenshot else ""
        screenshot_cell = f"[{shot_label}]({shot_label})" if shot_label else ""
        notes = "<br>".join(row["notes"]) if row["notes"] else ""
        lines.append(
            f"| {row['status']} | `{row['path']}` | {row['title']} | {screenshot_cell} | {notes} |"
        )
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_dependency_failure(out_dir: Path, exc: BaseException) -> None:
    rows = [
        {
            "status": "FAIL",
            "path": "(browser startup)",
            "title": "Playwright dependency unavailable",
            "screenshot": "",
            "notes": [
                f"{type(exc).__name__}: {exc}",
                "Reinstall Python Playwright and browser drivers before running screenshots.",
            ],
        }
    ]
    write_report(out_dir, rows)


def playwright_driver_error() -> FileNotFoundError | None:
    driver_node = Path(playwright_package.__file__).resolve().parent / "driver" / "node"
    if driver_node.exists():
        return None
    return FileNotFoundError(f"Playwright driver node not found at {driver_node}")


def main() -> int:
    base_url = os.environ.get("SITE_URL", DEFAULT_BASE_URL)
    timeout_ms = int(os.environ.get("SMOKE_TIMEOUT_MS", "15000"))
    forbidden = env_list("SMOKE_FORBIDDEN_TEXT", DEFAULT_FORBIDDEN)
    out_dir = snapshot_dir()
    out_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    has_failure = False

    dependency_error = playwright_driver_error()
    if dependency_error:
        write_dependency_failure(out_dir, dependency_error)
        print(f"[smoke] unable to start Playwright: {dependency_error}", file=sys.stderr)
        print(f"[smoke] report: {out_dir / 'smoke-index.md'}", file=sys.stderr)
        return 2

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 800})

            for index, spec in enumerate(choose_routes(), start=1):
                notes: list[str] = []
                status = "PASS"
                title = ""
                screenshot_path = ""
                console_errors: list[str] = []

                page = context.new_page()
                page.on(
                    "console",
                    lambda msg, bucket=console_errors: bucket.append(msg.text)
                    if msg.type == "error"
                    else None,
                )
                page.on("pageerror", lambda exc, bucket=console_errors: bucket.append(str(exc)))

                try:
                    response = page.goto(absolute_url(base_url, spec.path), wait_until="domcontentloaded", timeout=timeout_ms)
                    page.wait_for_load_state("networkidle", timeout=timeout_ms)

                    http_status = response.status if response else 0
                    if spec.optional and http_status in {404, 501}:
                        status = "SKIP"
                        notes.append(f"optional future route returned {http_status}")
                    elif not response or not response.ok:
                        status = "FAIL"
                        notes.append(f"HTTP status {http_status}")

                    title = page.title().strip()
                    if status != "SKIP" and not title:
                        status = "FAIL"
                        notes.append("page title is empty")

                    if status != "SKIP" and page.locator(spec.selector).count() == 0:
                        status = "FAIL"
                        notes.append(f"missing selector `{spec.selector}`")

                    if status != "SKIP":
                        text = page_text(page)
                        for token in forbidden:
                            if token and token in text:
                                status = "FAIL"
                                notes.append(f"forbidden text found: `{token}`")
                        for issue in visible_raw_text_issues(text):
                            status = "FAIL"
                            notes.append(f"raw output pattern matched: `{issue}`")

                    if console_errors and status != "SKIP":
                        status = "FAIL"
                        notes.append("console errors: " + " | ".join(console_errors[:3]))

                except (PlaywrightTimeoutError, PlaywrightError, AssertionError) as exc:
                    status = "FAIL"
                    notes.append(f"{type(exc).__name__}: {exc}")
                finally:
                    if status == "FAIL":
                        screenshot_path = str(out_dir / f"{index:02d}-{safe_name(spec.name)}.png")
                        try:
                            page.screenshot(path=screenshot_path, full_page=True)
                        except PlaywrightError as exc:
                            notes.append(f"screenshot failed: {exc}")
                    page.close()

                if status == "FAIL":
                    has_failure = True

                rows.append(
                    {
                        "status": status,
                        "path": spec.path,
                        "title": title.replace("|", "\\|"),
                        "screenshot": screenshot_path,
                        "notes": notes,
                    }
                )
                print(f"[smoke] {status:4} {spec.path} {'; '.join(notes)}")

            context.close()
            browser.close()

    except (PlaywrightError, FileNotFoundError) as exc:
        write_dependency_failure(out_dir, exc)
        print(f"[smoke] unable to start Playwright: {type(exc).__name__}: {exc}", file=sys.stderr)
        print(f"[smoke] report: {out_dir / 'smoke-index.md'}", file=sys.stderr)
        return 2

    write_report(out_dir, rows)
    print(f"[smoke] report: {out_dir / 'smoke-index.md'}")
    return 1 if has_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
