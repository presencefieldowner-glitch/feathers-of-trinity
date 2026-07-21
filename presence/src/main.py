"""Demo orchestration wiring the presence/state/quantum/daas modules together.

Run with: python main.py  (from the presence/src/ directory)
"""

from __future__ import annotations

import time

from core.presence_engine import PresenceEngine, Signal
from core.state_manager import StateManager
from daas.microquantum_proc import MicroQuantumProcessor
from daas.temporal_echo_sync import TemporalEchoSync

LARGE_REGISTER_SIZE = 1_000_000


def main() -> None:
    engine = PresenceEngine()
    engine.register_source("manual", lambda: Signal("manual", 0.8))

    gate = StateManager(threshold=0.5)
    result = gate.run_if_permitted(engine.score(), lambda: print("automation loop running"))
    print(f"intent gate: {result}")

    processor = MicroQuantumProcessor(register_size=4, seed=42)
    print(f"microquantum measurements: {processor.run().measurements}")

    # Same classical mock as above, scaled up -- LARGE_REGISTER_SIZE plain
    # RQubit objects, each measured with one Python `random` call. Not a
    # claim about real qubit counts or quantum hardware; see
    # docs/QUANTUM_AWARE_DAAS.md. Summarized rather than printed in full.
    large_scale = MicroQuantumProcessor(register_size=LARGE_REGISTER_SIZE, seed=42)
    started = time.perf_counter()
    large_result = large_scale.run()
    elapsed = time.perf_counter() - started
    ones = sum(large_result.measurements)
    total = len(large_result.measurements)
    print(
        f"large-scale microquantum run: {total:,} rqubits measured in {elapsed:.3f}s "
        f"-- {ones:,} ones / {total - ones:,} zeros"
    )

    sync = TemporalEchoSync()
    sync.record_historical("throughput", 10.0)
    sync.record_projected("throughput", 14.0)
    print(f"temporal echoes: {sync.echoes()}")


if __name__ == "__main__":
    main()
