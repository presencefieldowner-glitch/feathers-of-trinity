"""Aligns historical (logged) data points with forward-looking (projected) ones.

"Temporal echo" is project naming for a lag/lead pair on the same key --
this is ordinary time-series alignment, not a claim about time travel or
retrocausality.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Echo:
    key: str
    historical: float | None
    projected: float | None

    @property
    def delta(self) -> float | None:
        if self.historical is None or self.projected is None:
            return None
        return self.projected - self.historical


class TemporalEchoSync:
    def __init__(self) -> None:
        self._historical: dict[str, float] = {}
        self._projected: dict[str, float] = {}

    def record_historical(self, key: str, value: float) -> None:
        self._historical[key] = value

    def record_projected(self, key: str, value: float) -> None:
        self._projected[key] = value

    def echoes(self) -> list[Echo]:
        keys = set(self._historical) | set(self._projected)
        return [
            Echo(key, self._historical.get(key), self._projected.get(key))
            for key in sorted(keys)
        ]
