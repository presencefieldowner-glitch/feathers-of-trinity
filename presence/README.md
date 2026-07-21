# presence

An exploratory, conceptual subsystem within the Domain Node Platform
monorepo -- distinct from `services/api` and `engines/intelligence`.
Credited to Joseph Michael Rounsaville; see `../PHILOSOPHY.md` for the
platform's design paradigm.

## What this is

A small set of Python modules prototyping an idea from the platform's
vision: gating automation behind an explicit "intent" signal, using a
classical, mock "quantum" register as a stand-in for future paradigm-scale
processing, and syncing historical/projected data pairs.

**None of the "quantum" naming in this directory refers to real quantum
computing.** `RQubitSimulator` and related modules are classical
simulations built with Python's standard library, intended for prototyping
and naming continuity with the project's docs -- see the disclaimers in
`docs/QUANTUM_AWARE_DAAS.md` and `docs/RQUBITS_PROJECTIONS.md`.

## Layout

```
src/
  core/     presence_engine.py, state_manager.py     -- signal aggregation + intent gating
  quantum/  r_qubit_simulator.py, computational_threshold.py -- mock qubit register + concurrency cap
  daas/     microquantum_proc.py, temporal_echo_sync.py -- pipeline wiring + historical/projected sync
  main.py   demo entry point wiring the above together
docs/       architecture notes for each area, each with an explicit naming disclaimer
```

## Running the demo

```bash
cd presence/src
python main.py
```

No dependencies beyond the Python standard library.
