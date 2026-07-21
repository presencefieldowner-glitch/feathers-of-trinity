"""Concurrency/throughput limiter for the presence pipeline.

"Paradigm-scale processing limits" is descriptive naming for what this
module actually does: cap how many simulated operations run at once, the
same semaphore pattern as core/runtime-kernel's ResourceManager in the
main platform.
"""

from __future__ import annotations

import threading


class ComputationalThreshold:
    def __init__(self, max_concurrent: int) -> None:
        if max_concurrent < 1:
            raise ValueError("max_concurrent must be at least 1")
        self._semaphore = threading.Semaphore(max_concurrent)
        self.max_concurrent = max_concurrent

    def __enter__(self) -> "ComputationalThreshold":
        self._semaphore.acquire()
        return self

    def __exit__(self, *exc_info: object) -> None:
        self._semaphore.release()
