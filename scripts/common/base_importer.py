from __future__ import annotations

import argparse
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, ClassVar

from .excel import load_excel
from .json_writer import write_json
from .validation import validate_platform_document


class BaseImporter(ABC):
    SCHEMA_VERSION: ClassVar[int] = 1

    PLATFORM_ID: ClassVar[str]
    PLATFORM_NAME: ClassVar[str]
    PLATFORM_GROUP: ClassVar[str]
    PLATFORM_TYPE: ClassVar[str]
    PLATFORM_CATEGORY: ClassVar[str]
    CURRENCY: ClassVar[str] = "EUR"
    WEBSITE: ClassVar[str | None] = None

    DEFAULT_INPUT: ClassVar[Path]
    DEFAULT_OUTPUT: ClassVar[Path]

    def __init__(
        self,
        input_path: Path,
        output_path: Path,
    ) -> None:
        self.input_path = input_path.resolve()
        self.output_path = output_path.resolve()
        self.workbook = None

    def load(self) -> None:
        self.workbook = load_excel(self.input_path)

    @abstractmethod
    def build_document(self) -> dict[str, Any]:
        raise NotImplementedError

    def validate(self, document: dict[str, Any]) -> None:
        validate_platform_document(document)
        self.validate_platform_specific(document)

    def validate_platform_specific(
        self,
        document: dict[str, Any],
    ) -> None:
        return None

    def run(self) -> dict[str, Any]:
        self.print_header()
        self.load()

        document = self.build_document()
        document.setdefault("schemaVersion", self.SCHEMA_VERSION)
        document.setdefault(
            "generatedAt",
            datetime.now().astimezone().isoformat(
                timespec="seconds"
            ),
        )

        self.validate(document)
        write_json(document, self.output_path)
        self.print_summary(document)

        return document

    def print_header(self) -> None:
        print("=" * 64)
        print(f"{self.PLATFORM_NAME.upper()} IMPORTER")
        print("=" * 64)
        print(f"Excel failas: {self.input_path}")

    def print_summary(
        self,
        document: dict[str, Any],
    ) -> None:
        summary = document["summary"]

        print(
            f"✅ Nuskaityta investicijų: "
            f"{summary['totalInvestments']}"
        )
        print(
            f"✅ Aktyvių: "
            f"{summary['activeInvestments']}"
        )
        print(
            f"✅ Užbaigtų: "
            f"{summary['completedInvestments']}"
        )
        print(
            f"✅ Investuota dabar: "
            f"{summary['invested']:.2f} EUR"
        )
        print(
            f"✅ Dabartinė vertė: "
            f"{summary['currentValue']:.2f} EUR"
        )
        print(f"✅ JSON sukurtas: {self.output_path}")

    @classmethod
    def parse_args(cls) -> argparse.Namespace:
        parser = argparse.ArgumentParser(
            description=(
                f"{cls.PLATFORM_NAME} Excel importeris "
                "į Portfolio V2 JSON."
            )
        )

        parser.add_argument(
            "--input",
            type=Path,
            default=cls.DEFAULT_INPUT,
        )
        parser.add_argument(
            "--output",
            type=Path,
            default=cls.DEFAULT_OUTPUT,
        )

        return parser.parse_args()

    @classmethod
    def main(cls) -> None:
        args = cls.parse_args()
        cls(args.input, args.output).run()
