#!/usr/bin/env python3
"""
Tests for license enforcement via heartbeat response.

Validates:
- _handle_license_status correctly parses license_expired / license_exceeded / ok
- CLOUD_READ_ONLY and _license_read_only config flags are set/cleared properly
- Graceful handling of missing or malformed license fields
- send_heartbeat returns parsed JSON response (dict) or None
- Config loads without CLOUD_API_KEY (free-tier local-only mode)

Run: python tests/test_license_enforcement.py
"""

import importlib
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch, call

# Ensure config can load without CLOUD_API_KEY
os.environ.pop("CLOUD_API_KEY", None)
os.environ.setdefault("CLOUD_API_URL", "http://test.example.com")
os.environ["CLOUD_READ_ONLY"] = "False"

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def _reload_config():
    """Reload config module to reset all runtime state."""
    import config
    importlib.reload(config)
    return config


def _make_api_stub():
    """
    Build a minimal stand-in for Api that has _handle_license_status
    wired to mock signals, without importing PyQt6.

    We re-implement _handle_license_status by extracting its pure logic
    so we can test config state transitions in isolation.
    """
    cfg = _reload_config()

    class FakeApi:
        """Minimal mock of Api for license logic testing."""

        def __init__(self):
            self._license_warning = MagicMock()  # .emit(msg)
            self._license_restored = MagicMock()  # .emit()

        def _handle_license_status(self, status: str, license_info: dict) -> None:
            """Exact replica of Api._handle_license_status logic."""
            tier = license_info.get("tier", "unknown")
            expires_at = license_info.get("expires_at", "")
            stations_used = license_info.get("stations_used")
            stations_max = license_info.get("stations_max")

            if status in ("license_expired", "license_exceeded"):
                if not cfg.CLOUD_READ_ONLY:
                    cfg.CLOUD_READ_ONLY = True
                    if cfg.LIVE_SYNC_ENABLED:
                        cfg.LIVE_SYNC_ENABLED = False
                cfg._license_read_only = True
                if status == "license_expired":
                    display_msg = f"License expired ({tier} tier, expired {expires_at}) — cloud sync disabled"
                else:
                    display_msg = (
                        f"Station limit exceeded ({stations_used}/{stations_max} "
                        f"on {tier} tier) — cloud sync disabled"
                    )
                self._license_warning.emit(display_msg)
            elif status == "ok":
                cfg._license_info = license_info
                if cfg.CLOUD_READ_ONLY and getattr(cfg, '_license_read_only', False):
                    cfg.CLOUD_READ_ONLY = False
                    cfg._license_read_only = False
                    self._license_restored.emit()

    return FakeApi(), cfg


# =========================================================================
# Test: config loads without CLOUD_API_KEY
# =========================================================================

class TestConfigWithoutApiKey(unittest.TestCase):
    """Verify config.py loads cleanly when CLOUD_API_KEY is not set."""

    def test_no_crash_without_api_key(self):
        """Config module must load without CLOUD_API_KEY — free-tier mode."""
        env = os.environ.copy()
        env.pop("CLOUD_API_KEY", None)
        with patch.dict(os.environ, env, clear=True):
            cfg = _reload_config()
            self.assertIsNone(cfg.CLOUD_API_KEY)
            self.assertFalse(cfg.CLOUD_READ_ONLY)
            self.assertFalse(cfg._license_read_only)
            self.assertIsNone(cfg._license_info)

    def test_license_flags_initial_state(self):
        """Runtime license flags start at their defaults."""
        cfg = _reload_config()
        self.assertFalse(cfg._license_read_only)
        self.assertIsNone(cfg._license_info)


# =========================================================================
# Test: license_expired heartbeat status
# =========================================================================

class TestLicenseExpired(unittest.TestCase):
    """Heartbeat returns status=license_expired."""

    def test_sets_read_only_on_expired(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_expired", {
            "tier": "starter",
            "expires_at": "2026-02-01T00:00:00Z",
            "stations_used": 2,
            "stations_max": 3,
        })

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        self.assertTrue(cfg._license_read_only)

    def test_emits_warning_with_expiry_details(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_expired", {
            "tier": "pro",
            "expires_at": "2026-01-15T00:00:00Z",
            "stations_used": 1,
            "stations_max": 10,
        })

        api._license_warning.emit.assert_called_once()
        msg = api._license_warning.emit.call_args[0][0]
        self.assertIn("expired", msg.lower())
        self.assertIn("pro", msg)
        self.assertIn("2026-01-15", msg)

    def test_disables_live_sync_on_expired(self):
        api, cfg = _make_api_stub()
        cfg.LIVE_SYNC_ENABLED = True

        api._handle_license_status("license_expired", {
            "tier": "starter",
            "expires_at": "2026-02-01T00:00:00Z",
        })

        self.assertFalse(cfg.LIVE_SYNC_ENABLED)

    def test_idempotent_on_repeated_expired(self):
        """Multiple expired heartbeats don't double-toggle or error."""
        api, cfg = _make_api_stub()

        for _ in range(3):
            api._handle_license_status("license_expired", {
                "tier": "starter",
                "expires_at": "2026-02-01T00:00:00Z",
            })

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        self.assertTrue(cfg._license_read_only)
        # Warning emitted each heartbeat (keeps UI updated)
        self.assertEqual(api._license_warning.emit.call_count, 3)


# =========================================================================
# Test: license_exceeded heartbeat status
# =========================================================================

class TestLicenseExceeded(unittest.TestCase):
    """Heartbeat returns status=license_exceeded."""

    def test_sets_read_only_on_exceeded(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_exceeded", {
            "tier": "starter",
            "expires_at": "2027-01-01T00:00:00Z",
            "stations_used": 4,
            "stations_max": 3,
        })

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        self.assertTrue(cfg._license_read_only)

    def test_emits_warning_with_station_counts(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_exceeded", {
            "tier": "starter",
            "expires_at": "2027-01-01T00:00:00Z",
            "stations_used": 4,
            "stations_max": 3,
        })

        api._license_warning.emit.assert_called_once()
        msg = api._license_warning.emit.call_args[0][0]
        self.assertIn("4/3", msg)
        self.assertIn("starter", msg)
        self.assertIn("exceeded", msg.lower())


# =========================================================================
# Test: status restored to ok
# =========================================================================

class TestLicenseRestored(unittest.TestCase):
    """Heartbeat status returns to ok after license enforcement."""

    def test_restores_normal_mode(self):
        api, cfg = _make_api_stub()

        # First: enter restricted mode
        api._handle_license_status("license_expired", {
            "tier": "starter",
            "expires_at": "2026-02-01T00:00:00Z",
        })
        self.assertTrue(cfg.CLOUD_READ_ONLY)

        # Then: license renewed
        api._handle_license_status("ok", {
            "tier": "pro",
            "expires_at": "2027-06-01T00:00:00Z",
            "stations_used": 2,
            "stations_max": 10,
        })

        self.assertFalse(cfg.CLOUD_READ_ONLY)
        self.assertFalse(cfg._license_read_only)
        api._license_restored.emit.assert_called_once()

    def test_stores_license_info_on_ok(self):
        api, cfg = _make_api_stub()
        license_data = {
            "tier": "pro",
            "expires_at": "2027-06-01T00:00:00Z",
            "stations_used": 2,
            "stations_max": 10,
        }
        api._handle_license_status("ok", license_data)

        self.assertEqual(cfg._license_info, license_data)

    def test_does_not_restore_user_set_read_only(self):
        """If user manually set CLOUD_READ_ONLY, ok status must not override it."""
        api, cfg = _make_api_stub()
        cfg.CLOUD_READ_ONLY = True
        cfg._license_read_only = False  # user-set, not license-set

        api._handle_license_status("ok", {"tier": "pro"})

        # Must stay read-only — user intended this
        self.assertTrue(cfg.CLOUD_READ_ONLY)
        api._license_restored.emit.assert_not_called()

    def test_full_cycle_expired_then_restored(self):
        """Complete cycle: ok → expired → ok."""
        api, cfg = _make_api_stub()

        # Normal heartbeat
        api._handle_license_status("ok", {
            "tier": "pro",
            "stations_used": 1,
            "stations_max": 10,
        })
        self.assertFalse(cfg.CLOUD_READ_ONLY)

        # License expires
        api._handle_license_status("license_expired", {
            "tier": "pro",
            "expires_at": "2026-03-01T00:00:00Z",
        })
        self.assertTrue(cfg.CLOUD_READ_ONLY)
        self.assertTrue(cfg._license_read_only)

        # License renewed
        api._handle_license_status("ok", {
            "tier": "pro",
            "expires_at": "2027-03-01T00:00:00Z",
            "stations_used": 1,
            "stations_max": 10,
        })
        self.assertFalse(cfg.CLOUD_READ_ONLY)
        self.assertFalse(cfg._license_read_only)

    def test_full_cycle_exceeded_then_restored(self):
        """Complete cycle: ok → exceeded → ok."""
        api, cfg = _make_api_stub()

        api._handle_license_status("license_exceeded", {
            "tier": "starter",
            "stations_used": 5,
            "stations_max": 3,
        })
        self.assertTrue(cfg.CLOUD_READ_ONLY)

        api._handle_license_status("ok", {
            "tier": "pro",
            "stations_used": 5,
            "stations_max": 10,
        })
        self.assertFalse(cfg.CLOUD_READ_ONLY)


# =========================================================================
# Test: graceful handling of missing/malformed fields
# =========================================================================

class TestLicenseMissingFields(unittest.TestCase):
    """License info may arrive with missing or unexpected fields."""

    def test_empty_license_dict(self):
        """Empty license dict should not crash."""
        api, cfg = _make_api_stub()
        api._handle_license_status("license_expired", {})

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        msg = api._license_warning.emit.call_args[0][0]
        self.assertIn("unknown", msg)  # default tier

    def test_missing_expires_at(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_expired", {"tier": "starter"})

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        msg = api._license_warning.emit.call_args[0][0]
        self.assertIn("starter", msg)

    def test_missing_stations_fields(self):
        api, cfg = _make_api_stub()
        api._handle_license_status("license_exceeded", {"tier": "starter"})

        self.assertTrue(cfg.CLOUD_READ_ONLY)
        msg = api._license_warning.emit.call_args[0][0]
        self.assertIn("None/None", msg)

    def test_unknown_status_is_noop(self):
        """Unrecognized status values should be silently ignored."""
        api, cfg = _make_api_stub()
        api._handle_license_status("something_new", {"tier": "pro"})

        self.assertFalse(cfg.CLOUD_READ_ONLY)
        api._license_warning.emit.assert_not_called()
        api._license_restored.emit.assert_not_called()

    def test_ok_with_no_license_info(self):
        """status=ok with empty license info should not crash."""
        api, cfg = _make_api_stub()
        api._handle_license_status("ok", {})

        self.assertFalse(cfg.CLOUD_READ_ONLY)
        self.assertEqual(cfg._license_info, {})

    def test_none_values_in_license(self):
        """None values for all fields should not crash."""
        api, cfg = _make_api_stub()
        api._handle_license_status("license_expired", {
            "tier": None,
            "expires_at": None,
            "stations_used": None,
            "stations_max": None,
        })
        self.assertTrue(cfg.CLOUD_READ_ONLY)


# =========================================================================
# Test: non-dict license field in heartbeat response
# =========================================================================

class TestNonDictLicenseField(unittest.TestCase):
    """Heartbeat may return license as a string, number, or list."""

    def _simulate_send_handler(self, result):
        """Reproduce the _send() closure logic from main.py."""
        api, cfg = _make_api_stub()
        if result:
            raw_license = result.get("license")
            api._handle_license_status(
                status=result.get("status", "ok"),
                license_info=raw_license if isinstance(raw_license, dict) else {},
            )
        return api, cfg

    def test_license_as_string(self):
        """license='free' should not crash."""
        api, cfg = self._simulate_send_handler(
            {"ok": True, "status": "ok", "license": "free"}
        )
        self.assertFalse(cfg.CLOUD_READ_ONLY)

    def test_license_as_number(self):
        """license=0 should not crash."""
        api, cfg = self._simulate_send_handler(
            {"ok": True, "status": "license_expired", "license": 0}
        )
        self.assertTrue(cfg.CLOUD_READ_ONLY)

    def test_license_as_list(self):
        """license=[] should not crash."""
        api, cfg = self._simulate_send_handler(
            {"ok": True, "status": "ok", "license": []}
        )
        self.assertFalse(cfg.CLOUD_READ_ONLY)

    def test_license_as_none(self):
        """license=null should not crash."""
        api, cfg = self._simulate_send_handler(
            {"ok": True, "status": "ok", "license": None}
        )
        self.assertFalse(cfg.CLOUD_READ_ONLY)

    def test_no_license_field_at_all(self):
        """Response without license key should not crash."""
        api, cfg = self._simulate_send_handler(
            {"ok": True, "status": "ok"}
        )
        self.assertFalse(cfg.CLOUD_READ_ONLY)

    def test_heartbeat_returns_none(self):
        """Network failure (result=None) should not crash."""
        api, cfg = self._simulate_send_handler(None)
        self.assertFalse(cfg.CLOUD_READ_ONLY)


# =========================================================================
# Test: send_heartbeat returns dict (with license) or None
# =========================================================================

class TestSendHeartbeatReturnType(unittest.TestCase):
    """Verify send_heartbeat returns parsed JSON dict, not bool."""

    def setUp(self):
        """Reset config state before each test."""
        _reload_config()

    def _make_sync(self):
        """Create a SyncService with a fresh mock for requests."""
        mock_requests = MagicMock()
        sys.modules["requests"] = mock_requests
        importlib.invalidate_caches()
        import sync
        importlib.reload(sync)
        svc = sync.SyncService.__new__(sync.SyncService)
        svc.api_url = "http://test.example.com"
        svc.api_key = "test-key"
        svc.connection_timeout = 10
        # Return the module-level reference that send_heartbeat actually uses
        return svc, sync.requests

    def test_success_returns_dict_with_license(self):
        svc, mock_req = self._make_sync()
        response_data = {
            "ok": True,
            "status": "ok",
            "license": {
                "tier": "pro",
                "expires_at": "2027-01-01T00:00:00Z",
                "stations_used": 2,
                "stations_max": 10,
            },
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = response_data
        mock_req.post.return_value = mock_resp

        result = svc.send_heartbeat("Gate A", "epoch1", 42)

        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "ok")
        self.assertIn("license", result)
        self.assertEqual(result["license"]["tier"], "pro")

    def test_success_returns_dict_with_expired_license(self):
        svc, mock_req = self._make_sync()
        response_data = {
            "ok": True,
            "status": "license_expired",
            "license": {
                "tier": "starter",
                "expires_at": "2026-01-01T00:00:00Z",
                "stations_used": 1,
                "stations_max": 3,
            },
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = response_data
        mock_req.post.return_value = mock_resp

        result = svc.send_heartbeat("Gate A", None, 0)

        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "license_expired")

    def test_network_failure_returns_none(self):
        svc, mock_req = self._make_sync()
        mock_req.post.side_effect = Exception("connection refused")

        result = svc.send_heartbeat("Gate A", None, 0, retries=0)

        self.assertIsNone(result)

    def test_json_parse_failure_returns_ok_dict(self):
        """If response is 200 but not valid JSON, return fallback dict."""
        svc, mock_req = self._make_sync()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.side_effect = ValueError("not JSON")
        mock_req.post.return_value = mock_resp

        result = svc.send_heartbeat("Gate A", None, 0)

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("ok"))

    def test_read_only_skips_heartbeat(self):
        """User-set read-only mode skips heartbeat entirely."""
        svc, mock_req = self._make_sync()
        cfg = _reload_config()
        cfg.CLOUD_READ_ONLY = True
        cfg._license_read_only = False

        result = svc.send_heartbeat("Gate A", None, 0)

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("skipped"))
        mock_req.post.assert_not_called()

    def test_license_read_only_still_sends_heartbeat(self):
        """License-enforced read-only must still send heartbeat for re-check."""
        svc, mock_req = self._make_sync()
        cfg = _reload_config()
        cfg.CLOUD_READ_ONLY = True
        cfg._license_read_only = True

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"ok": True, "status": "ok", "license": {"tier": "pro"}}
        mock_req.post.return_value = mock_resp

        result = svc.send_heartbeat("Gate A", None, 0)

        mock_req.post.assert_called_once()
        self.assertEqual(result["status"], "ok")


if __name__ == "__main__":
    unittest.main(verbosity=2)
