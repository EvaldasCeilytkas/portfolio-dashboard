"""Excel workbook path resolution for a gradual .xlsx -> .xlsm migration."""
from pathlib import Path

EXTENSIONS = (".xlsm", ".xlsx")

def excel_path(path):
    """Prefer macro-enabled workbook, then the legacy workbook. Never rename files."""
    path = Path(path)
    if path.suffix.lower() not in EXTENSIONS:
        return path
    for suffix in EXTENSIONS:
        candidate = path.with_suffix(suffix)
        if candidate.is_file():
            return candidate
    return path  # Keep the caller's existing missing-file handling.

def excel_glob(directory, pattern):
    """Return supported workbooks, deduplicated by stem, preferring .xlsm."""
    directory = Path(directory)
    if not pattern.lower().endswith((".xlsx", ".xlsm")):
        return sorted(directory.glob(pattern))
    stem_pattern = pattern[:-5]
    found = {}
    for suffix in (".xlsx", ".xlsm"):
        for item in sorted(directory.glob(stem_pattern + suffix)):
            found[item.stem.casefold()] = item
    return sorted(found.values())
