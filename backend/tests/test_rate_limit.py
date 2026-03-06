from datetime import datetime, timedelta, timezone

from app.core.rate_limit import LoginRateLimiter, RateLimitConfig, build_rate_limit_key


def test_rate_limiter_blocks_after_limit() -> None:
    limiter = LoginRateLimiter(RateLimitConfig(max_attempts=2, window_minutes=15))
    key = build_rate_limit_key('admin', '127.0.0.1')

    assert limiter.allow(key) is True
    limiter.register_failure(key)
    assert limiter.allow(key) is True
    limiter.register_failure(key)
    assert limiter.allow(key) is False


def test_rate_limiter_success_resets_failures() -> None:
    limiter = LoginRateLimiter(RateLimitConfig(max_attempts=1, window_minutes=15))
    key = build_rate_limit_key('doctor', '127.0.0.1')

    limiter.register_failure(key)
    assert limiter.allow(key) is False

    limiter.register_success(key)
    assert limiter.allow(key) is True


def test_rate_limiter_prunes_old_attempts() -> None:
    limiter = LoginRateLimiter(RateLimitConfig(max_attempts=1, window_minutes=1))
    key = build_rate_limit_key('researcher', '127.0.0.1')

    limiter.register_failure(key)
    limiter._attempts[key].appendleft(datetime.now(timezone.utc) - timedelta(minutes=5))

    assert limiter.allow(key) is False

    limiter._attempts[key].clear()
    assert limiter.allow(key) is True
