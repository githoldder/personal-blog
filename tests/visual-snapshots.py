#!/usr/bin/env python3
"""Capture S16 visual-review screenshots and write an index.md report."""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
import playwright as playwright_package


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "http://127.0.0.1:4322"

VIEWPORTS = {
    "mobile": {"width": 390, "height": 844},
    "tablet": {"width": 768, "height": 1024},
    "desktop": {"width": 1440, "height": 900},
    "wide": {"width": 1920, "height": 1080},
}


@dataclass(frozen=True)
class VisualTarget:
    name: str
    path: str
    viewports: tuple[str, ...] = ("mobile", "tablet", "desktop", "wide")
    selector: str = "main"
    interaction: str = "none"
    reduced_motion: bool = False
    optional: bool = False


def report_dir() -> Path:
    stamp = os.environ.get("SNAPSHOT_DATE") or date.today().isoformat()
    root = Path(os.environ.get("SNAPSHOT_ROOT", ROOT / "sense/reports/visual-snapshots"))
    return root / stamp


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip().lower())
    return cleaned.strip("-")[:90] or "snapshot"


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def absolute_url(base_url: str, path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))


def first_search_url(predicate, fallback: str) -> str:
    search_index = read_json(ROOT / "public/assets/search-index.json", [])
    if not isinstance(search_index, list):
        return fallback
    for item in search_index:
        if isinstance(item, dict) and predicate(item):
            url = item.get("url")
            if isinstance(url, str) and url.startswith("/"):
                return url
    return fallback


def first_deck_preview() -> str:
    manifest = read_json(ROOT / "public/assets/decks/manifest.json", {})
    decks = manifest.get("decks", []) if isinstance(manifest, dict) else []
    for deck in decks:
        slug = deck.get("slug") if isinstance(deck, dict) else None
        if slug:
            return f"/slides/{slug}/"
    return "/decks/"


def build_targets() -> list[VisualTarget]:
    note_url = first_search_url(
        lambda item: item.get("type") == "note"
        and item.get("url", "").startswith("/notes/")
        and "book" not in item.get("tags", [])
        and "canvas" not in item.get("tags", [])
        and "excalidraw" not in item.get("tags", []),
        "/notes/",
    )
    canvas_url = first_search_url(
        lambda item: item.get("type") == "note"
        and item.get("url", "").startswith("/notes/")
        and (
            "canvas" in item.get("tags", [])
            or str(item.get("sourcePath", "")).startswith("content/notes/canvas-")
        ),
        "/lab/canvas",
    )
    deck_preview = first_deck_preview()

    return [
        VisualTarget("homepage-first-viewport", "/", selector="header"),
        VisualTarget("header-logo-hover", "/", viewports=("mobile", "desktop"), selector="[data-site-mark]", interaction="hover-logo"),
        VisualTarget("header-logo-tree-clicked", "/", viewports=("mobile", "desktop"), selector="[data-site-mark]", interaction="click-logo-twice"),
        VisualTarget("homepage-book-window-shelf", "/", viewports=("mobile", "desktop"), selector="main"),
        VisualTarget("library-shelf", "/library/", selector="#books-container"),
        VisualTarget("canvas-viewer", canvas_url, selector="main"),
        VisualTarget("note-theme-article", note_url, viewports=("mobile", "desktop"), selector="article, main"),
        VisualTarget("resume-web", "/resume/", selector="main"),
        VisualTarget("deck-index", "/decks/", selector="main"),
        VisualTarget("deck-preview", deck_preview, viewports=("desktop", "wide"), selector="body"),
        VisualTarget("typst-lab-shell-future", "/lab/typst", viewports=("desktop",), selector="main", optional=True),
        VisualTarget("admin-dashboard", "/admin", selector="main"),
        VisualTarget("reduced-motion-homepage", "/", viewports=("mobile", "desktop"), selector="main", reduced_motion=True),
        VisualTarget("reduced-motion-canvas", canvas_url, viewports=("mobile", "desktop"), selector="main", reduced_motion=True),
    ]


def apply_interaction(page, interaction: str) -> None:
    if interaction == "hover-logo":
        page.locator("[data-site-mark]").first.hover(timeout=3000)
        page.wait_for_timeout(250)
    elif interaction == "click-logo-twice":
        mark = page.locator("[data-site-mark]").first
        mark.click(timeout=3000)
        page.wait_for_timeout(120)
        mark.click(timeout=3000)
        page.wait_for_timeout(300)


def visual_issues(page, target: VisualTarget) -> list[str]:
    issues: list[str] = []

    overflow = page.evaluate(
        """
        () => Array.from(document.querySelectorAll('a, button, input, select, textarea, .book-card, [data-site-mark], .garden-item'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            return el.scrollWidth > Math.ceil(rect.width) + 2 || el.scrollHeight > Math.ceil(rect.height) + 2;
          })
          .slice(0, 8)
          .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(/\\s+/).slice(0, 2).join('.') : ''}`);
        """
    )
    if overflow:
        issues.append("possible overflow: " + ", ".join(overflow))

    if page.locator(target.selector).count() == 0:
        issues.append(f"missing selector `{target.selector}`")

    if "canvas" in target.name:
        body_text = page.locator("body").inner_text(timeout=2000)
        if re.search(r"\b(TEXT|FILE|LINK)\b", body_text):
            issues.append("canvas may expose raw node type labels")

    if "header-logo" in target.name:
        box = page.locator("[data-site-mark]").first.bounding_box(timeout=3000)
        if not box or box["width"] <= 0 or box["height"] <= 0:
            issues.append("site mark has no stable bounding box")

    return issues


def write_index(out_dir: Path, rows: list[dict]) -> None:
    lines = [
        "# Visual Snapshot Report",
        "",
        f"- Base URL: `{os.environ.get('SITE_URL', DEFAULT_BASE_URL)}`",
        f"- Output: `{out_dir.relative_to(ROOT) if out_dir.is_relative_to(ROOT) else out_dir}`",
        "- Review status: generated for manual S16 visual sign-off.",
        "",
        "| Status | Target | Viewport | Route | Motion | Screenshot | Notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        shot = row.get("screenshot") or ""
        shot_name = Path(shot).name if shot else ""
        shot_cell = f"[{shot_name}]({shot_name})" if shot_name else ""
        notes = "<br>".join(row["notes"]) if row["notes"] else "manual review required"
        lines.append(
            f"| {row['status']} | {row['target']} | {row['viewport']} | `{row['path']}` | {row['motion']} | {shot_cell} | {notes} |"
        )

    lines.extend(
        [
            "",
            "## Manual Review Checklist",
            "",
            "- Header remains usable on mobile and logo dimensions stay stable across seed/plant/tree states.",
            "- Book shelf reads as a shelf/window and has no clipped book titles or action buttons.",
            "- Canvas cards, arrows, colors, and groups are visible; raw node type labels are not visible.",
            "- Resume, decks, and admin first viewports contain meaningful content without large mock-data blocks.",
            "- Reduced-motion captures avoid heavy cursor/logo/canvas motion while preserving layout.",
            "- P0/P1 defects block release; P2 defects need explicit owner/deadline before release.",
            "",
        ]
    )
    (out_dir / "index.md").write_text("\n".join(lines), encoding="utf-8")


def write_dependency_failure(out_dir: Path, exc: BaseException) -> None:
    write_index(
        out_dir,
        [
            {
                "status": "FAIL",
                "target": "browser-startup",
                "viewport": "n/a",
                "path": "(browser startup)",
                "motion": "n/a",
                "screenshot": "",
                "notes": [
                    f"{type(exc).__name__}: {exc}",
                    "Reinstall Python Playwright and browser drivers before running screenshots.",
                ],
            }
        ],
    )


def playwright_driver_error() -> FileNotFoundError | None:
    driver_node = Path(playwright_package.__file__).resolve().parent / "driver" / "node"
    if driver_node.exists():
        return None
    return FileNotFoundError(f"Playwright driver node not found at {driver_node}")


def main() -> int:
    base_url = os.environ.get("SITE_URL", DEFAULT_BASE_URL)
    timeout_ms = int(os.environ.get("VISUAL_TIMEOUT_MS", "20000"))
    out_dir = report_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    has_failure = False

    dependency_error = playwright_driver_error()
    if dependency_error:
        write_dependency_failure(out_dir, dependency_error)
        print(f"[visual] unable to start Playwright: {dependency_error}", file=sys.stderr)
        print(f"[visual] report: {out_dir / 'index.md'}", file=sys.stderr)
        return 2

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)

            for target in build_targets():
                for viewport_name in target.viewports:
                    viewport = VIEWPORTS[viewport_name]
                    context = browser.new_context(
                        viewport=viewport,
                        reduced_motion="reduce" if target.reduced_motion else "no-preference",
                    )
                    page = context.new_page()
                    notes: list[str] = []
                    status = "PASS"
                    screenshot_path = out_dir / f"{safe_name(target.name)}-{viewport_name}.png"

                    try:
                        response = page.goto(
                            absolute_url(base_url, target.path),
                            wait_until="domcontentloaded",
                            timeout=timeout_ms,
                        )
                        page.wait_for_load_state("networkidle", timeout=timeout_ms)

                        http_status = response.status if response else 0
                        if target.optional and http_status in {404, 501}:
                            status = "SKIP"
                            notes.append(f"optional future route returned {http_status}")
                        elif not response or not response.ok:
                            status = "FAIL"
                            notes.append(f"HTTP status {http_status}")

                        if status != "SKIP":
                            apply_interaction(page, target.interaction)
                            notes.extend(visual_issues(page, target))
                            if notes:
                                status = "REVIEW"

                        page.screenshot(path=str(screenshot_path), full_page=False)

                    except (PlaywrightTimeoutError, PlaywrightError, AssertionError) as exc:
                        status = "FAIL"
                        notes.append(f"{type(exc).__name__}: {exc}")
                        try:
                            page.screenshot(path=str(screenshot_path), full_page=False)
                        except PlaywrightError:
                            screenshot_path = Path("")
                    finally:
                        page.close()
                        context.close()

                    if status == "FAIL":
                        has_failure = True

                    rows.append(
                        {
                            "status": status,
                            "target": target.name,
                            "viewport": f"{viewport_name} {viewport['width']}x{viewport['height']}",
                            "path": target.path,
                            "motion": "reduce" if target.reduced_motion else "default",
                            "screenshot": str(screenshot_path) if screenshot_path else "",
                            "notes": notes,
                        }
                    )
                    print(f"[visual] {status:6} {target.name} {viewport_name} {'; '.join(notes)}")

            browser.close()

    except (PlaywrightError, FileNotFoundError) as exc:
        write_dependency_failure(out_dir, exc)
        print(f"[visual] unable to start Playwright: {type(exc).__name__}: {exc}", file=sys.stderr)
        print(f"[visual] report: {out_dir / 'index.md'}", file=sys.stderr)
        return 2

    write_index(out_dir, rows)
    print(f"[visual] report: {out_dir / 'index.md'}")
    return 1 if has_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
