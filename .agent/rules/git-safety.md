# Git Safety

This project may be used by multiple agents. Git actions must be scoped.

## Before Commit

Run `git status` and explain change ownership.

## Forbidden Unless Explicitly Approved

```bash
git add .
git push
git reset --hard
git checkout -- .
```

## Allowed Pattern

```bash
git add path/to/file1 path/to/file2
git commit -m "S02-T01: describe change"
```

If the directory is not yet a Git repository, say so in the walkthrough instead of pretending commits were made.
