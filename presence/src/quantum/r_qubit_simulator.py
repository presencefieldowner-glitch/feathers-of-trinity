"""Classical mock of a quantum-style qubit register.

"RQubit" is a project-specific name for this module's simulated unit -- it
performs no physical quantum computation. States are modeled with
classical pseudo-randomness to approximate superposition/measurement for
prototyping purposes only.
"""

from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass
class RQubit:
    amplitude_zero: float = 0.7071067811865476  # 1/sqrt(2): equal superposition by default

    @property
    def amplitude_one(self) -> float:
        return (1 - self.amplitude_zero**2) ** 0.5

    def measure(self, rng: random.Random | None = None) -> int:
        source = rng or random
        probability_one = self.amplitude_one**2
        return 1 if source.random() < probability_one else 0


class RQubitSimulator:
    """Simulates measuring a register of independent RQubits."""

    def __init__(self, size: int, seed: int | None = None) -> None:
        if size < 1:
            raise ValueError("size must be at least 1")
        self.qubits = [RQubit() for _ in range(size)]
        self._rng = random.Random(seed)

    def measure_all(self) -> list[int]:
        return [q.measure(self._rng) for q in self.qubits]
