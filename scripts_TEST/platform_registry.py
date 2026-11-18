from __future__ import annotations

import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = PROJECT_ROOT / "src" / "data" / "platforms.json"


def load_platforms() -> list[dict[str, Any]]:
    """Load the canonical V2 platform registry."""
    with REGISTRY_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Platform registry root must be a JSON array.")

    return data


def get_platform(slug: str) -> dict[str, Any] | None:
    """Return one platform by slug."""
    normalized_slug = slug.strip().lower()

    for platform in load_platforms():
        if platform.get("slug") == normalized_slug:
            return platform

    return None


def get_enabled_platforms() -> list[dict[str, Any]]:
    """Return enabled platforms only."""
    return [
        platform
        for platform in load_platforms()
        if platform.get("enabled") is True
    ]


def get_platforms_by_group(group: str) -> list[dict[str, Any]]:
    """Return enabled platforms belonging to one group."""
    return [
        platform
        for platform in get_enabled_platforms()
        if platform.get("group") == group
    ]
