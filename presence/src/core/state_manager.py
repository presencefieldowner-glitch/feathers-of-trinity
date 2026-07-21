"""Gates automation execution behind an explicit human-intent signal.

Not a claim about detecting intent biologically or psychically -- "intent"
is whatever confidence value the caller supplies (e.g. a UI confirmation,
an approval score). This module just refuses to run a loop below threshold.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass
class IntentGateResult:
    allowed: bool
    intent: float
    threshold: float


class StateManager:
    def __init__(self, threshold: float = 0.5) -> None:
        if not 0.0 <= threshold <= 1.0:
            raise ValueError("threshold must be between 0.0 and 1.0")
        self.threshold = threshold

    def evaluate(self, intent: float) -> IntentGateResult:
        return IntentGateResult(intent >= self.threshold, intent, self.threshold)

    def run_if_permitted(self, intent: float, loop: Callable[[], None]) -> IntentGateResult:
        result = self.evaluate(intent)
        if result.allowed:
            loop()
        return result
