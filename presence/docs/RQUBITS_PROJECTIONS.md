# RQubit Projections & Computational Thresholds

Documentation for `src/quantum/computational_threshold.py` and the
"projection" half of `src/daas/temporal_echo_sync.py`.

## Computational thresholds

`ComputationalThreshold` is a concurrency limiter, not a claim about
processing limits inherent to any physical or theoretical computing
paradigm. "Paradigm-scale" is descriptive project language for "however
many concurrent simulated operations you configure it for" -- set via
`max_concurrent` in the constructor.

## Projections

`TemporalEchoSync` pairs a `historical` value with a `projected` value under
the same key and exposes their `delta`. "Projected" means whatever
forward-looking number the caller records with `record_projected()` -- e.g.
a forecast, a target, an estimate. There is no time-series forecasting
model in this repository yet; callers currently supply the projected value
themselves.
