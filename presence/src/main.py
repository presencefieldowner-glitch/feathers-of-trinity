"""Demo orchestration wiring the presence/state/quantum/daas modules together.

Run with: python main.py  (from the presence/src/ directory)
"""

from __future__ import annotations

from core.presence_engine import PresenceEngine, Signal
from core.state_manager import StateManager
from daas.microquantum_proc import MicroQuantumProcessor
from daas.temporal_echo_sync import TemporalEchoSync


def main() -> None:
    engine = PresenceEngine()
    engine.register_source("manual", lambda: Signal("manual", 0.8))

    gate = StateManager(threshold=0.5)
    result = gate.run_if_permitted(engine.score(), lambda: print("automation loop running"))
    print(f"intent gate: {result}")

    processor = MicroQuantumProcessor(register_size=4, seed=42)
    print(f"microquantum measurements: {processor.run().measurements}")

    sync = TemporalEchoSync()
    sync.record_historical("throughput", 10.0)
    sync.record_projected("throughput", 14.0)
    print(f"temporal echoes: {sync.echoes()}")


if __name__ == "__main__":
    main()
