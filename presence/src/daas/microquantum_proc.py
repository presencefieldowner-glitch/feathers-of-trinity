"""Execution pipeline that runs RQubit measurements through a threshold gate.

"MicroQuantum" refers to this small demo pipeline, not a hardware
processor. It wires RQubitSimulator and ComputationalThreshold together.
"""

from __future__ import annotations

from dataclasses import dataclass

from quantum.computational_threshold import ComputationalThreshold
from quantum.r_qubit_simulator import RQubitSimulator


@dataclass
class MicroQuantumResult:
    measurements: list[int]


class MicroQuantumProcessor:
    def __init__(self, register_size: int, max_concurrent: int = 1, seed: int | None = None) -> None:
        self._simulator = RQubitSimulator(register_size, seed=seed)
        self._threshold = ComputationalThreshold(max_concurrent)

    def run(self) -> MicroQuantumResult:
        with self._threshold:
            return MicroQuantumResult(self._simulator.measure_all())
