"""Conceptual telemetry bridge described in docs/BIOLOGY_DIGITAL_LAYER.md.

This is a software simulation, not a connection to biological hardware or
sensors. "Presence" here means a stream of caller-supplied signal values;
this module makes no claim to detecting human presence physically.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass
class Signal:
    name: str
    value: float
    weight: float = 1.0


class PresenceEngine:
    """Aggregates named signals into a single presence score.

    Callers register signal sources (arbitrary numeric telemetry, not
    physiological sensors) and the engine combines them into a weighted
    score other modules can act on.
    """

    def __init__(self) -> None:
        self._sources: dict[str, Callable[[], Signal]] = {}

    def register_source(self, name: str, source: Callable[[], Signal]) -> None:
        self._sources[name] = source

    def sample(self) -> list[Signal]:
        return [source() for source in self._sources.values()]

    def score(self) -> float:
        signals = self.sample()
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        return sum(s.value * s.weight for s in signals) / total_weight
