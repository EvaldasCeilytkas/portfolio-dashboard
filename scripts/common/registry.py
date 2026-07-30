from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path
from types import ModuleType
from typing import Iterable


def discover_importer_modules(
    package_name: str,
) -> list[ModuleType]:
    package = importlib.import_module(package_name)

    modules: list[ModuleType] = []

    for item in pkgutil.iter_modules(package.__path__):
        if not item.name.startswith("import_"):
            continue

        modules.append(
            importlib.import_module(
                f"{package_name}.{item.name}"
            )
        )

    return modules


def run_discovered_importers(
    package_names: Iterable[str],
) -> list[dict]:
    results: list[dict] = []

    for package_name in package_names:
        for module in discover_importer_modules(package_name):
            importer_class = getattr(
                module,
                "IMPORTER_CLASS",
                None,
            )

            if importer_class is None:
                continue

            args = importer_class.parse_args()
            results.append(
                importer_class(
                    args.input,
                    args.output,
                ).run()
            )

    return results
