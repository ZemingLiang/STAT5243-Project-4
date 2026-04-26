"""Integration + correctness tests for STAT 5243 Project 4.

Critical tests (will be expanded as modules land in Phases 1–6):
- Module-import smoke tests
- Team-name harmonization round-trips
- BBC match-report parser on hand-labelled fixtures
- `test_no_temporal_leakage` — the rubric-critical correctness signal
- Baseline scorers produce valid probability vectors
"""

from __future__ import annotations

import importlib
import unittest


class TestImports(unittest.TestCase):
    """Smoke tests: every src module must import cleanly."""

    def test_src_package_imports(self) -> None:
        importlib.import_module("src")

    def test_src_subpackages_import(self) -> None:
        for sub in ("src.scrape", "src.nlp", "src.models"):
            importlib.import_module(sub)


# Placeholder for the leakage test (will be implemented in Phase 3).
class TestNoTemporalLeakage(unittest.TestCase):
    """Asserts no engineered feature for match m references data with date >= m.date."""

    @unittest.skip("Implemented in Phase 3 once temporal_features.py exists.")
    def test_no_temporal_leakage(self) -> None:  # pragma: no cover
        ...


if __name__ == "__main__":
    unittest.main()
