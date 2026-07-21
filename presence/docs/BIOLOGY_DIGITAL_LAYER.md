# Biology <-> Digital Layer

Conceptual notes for `src/core/presence_engine.py` and `state_manager.py`.

This document describes a *philosophical* architecture, not a scientific or
medical claim. "Presence" is used the way `PresenceEngine` uses it in code: a
weighted aggregate of caller-supplied signals, not a sensor reading of a
human body or biological state.

## The idea

Automation systems tend to run on a fixed loop regardless of whether a human
is actually present, attentive, or intending the outcome. The "missing
layer" this module names is a gate between raw automation and its trigger:
before a loop runs, something should be able to say *a human meant for this
to happen* -- represented here as an `intent` float in `[0.0, 1.0]` that
`StateManager` checks against a threshold.

## What's implemented vs. aspirational

- **Implemented:** `PresenceEngine.score()` (weighted signal aggregation),
  `StateManager.evaluate()` / `run_if_permitted()` (threshold gating).
- **Aspirational:** real signal sources (UI confirmations, richer telemetry,
  etc.) -- the current code only ships a manual `Signal` you supply
  yourself. Nothing in this repository reads actual biological data.
