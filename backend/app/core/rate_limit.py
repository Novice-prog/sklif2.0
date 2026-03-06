from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock


@dataclass(frozen=True)
class RateLimitConfig:
    max_attempts: int = 10
    window_minutes: int = 15


class LoginRateLimiter:
    def __init__(self, config: RateLimitConfig | None = None):
        self._config = config or RateLimitConfig()
        self._attempts: dict[str, deque[datetime]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        with self._lock:
            self._prune_locked(key, now)
            return len(self._attempts[key]) < self._config.max_attempts

    def register_failure(self, key: str) -> None:
        now = datetime.now(timezone.utc)
        with self._lock:
            self._prune_locked(key, now)
            self._attempts[key].append(now)

    def register_success(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def _prune_locked(self, key: str, now: datetime) -> None:
        queue = self._attempts[key]
        threshold = now - timedelta(minutes=self._config.window_minutes)
        while queue and queue[0] < threshold:
            queue.popleft()


def build_rate_limit_key(identifier: str, client_host: str | None) -> str:
    normalized_identifier = (identifier or '').strip().lower()
    ip = client_host or 'unknown'
    return f'{normalized_identifier}:{ip}'
