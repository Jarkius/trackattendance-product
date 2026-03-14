---
title: When moving Python scripts from project root into subdirectories (scripts/, test
tags: [python, imports, sys-path, project-structure, scripts, trackattendance]
created: 2026-02-02
source: rrr: Jarkius/trackattendance-frontend
---

# When moving Python scripts from project root into subdirectories (scripts/, test

When moving Python scripts from project root into subdirectories (scripts/, tests/), relative imports like `from database import DatabaseManager` break. The reliable fix is a 4-line pattern at the top of each script:

```python
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.chdir(PROJECT_ROOT)
```

Use `resolve()` not `abspath` (handles symlinks), `insert(0)` not `append` (ensures precedence), and `os.chdir` (fixes relative file paths like `Path("data/database.db")`). This also enables importing from config.py instead of hardcoding API keys — scripts become location-independent without requiring __init__.py or package installation.

---
*Added via Oracle Learn*
