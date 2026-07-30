from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_json(
    data: dict[str, Any],
    output_path: Path,
    *,
    indent: int = 2,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    temporary_path = output_path.with_suffix(
        output_path.suffix + ".tmp"
    )

    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=indent,
        )

    temporary_path.replace(output_path)
