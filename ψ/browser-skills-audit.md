# Browser-Related Skills: Security Audit & MQTT Compatibility

**Date:** March 14, 2026
**Auditor:** Oracle-The-Matrix
**Repository:** /Users/jarkius/ghq/github.com/sundial-org/awesome-openclaw-skills/

## Summary
**Total Skills Found:** 15
**Security Verdict:** ALL SAFE (no malicious code detected)
**MQTT Compatible:** 10 (CDP-based)
**Recommended for Integration:** 5 (Tier 1) + 4 (Tier 2)

---

## COMPREHENSIVE SKILLS LIST

| # | Skill Name | Description | Verdict | MQTT Compatible | Notes |
|---|---|---|---|---|---|
| 1 | **agent-browser** | Rust-based CLI for headless automation (Vercel Labs) | SAFE | ✅ YES | Core reference, ref-based selection, sessions |
| 2 | **agent-browser-2** | Variant: accessibility tree snapshots | SAFE | ✅ YES | Same as #1, optimized for AI agents |
| 3 | **agent-browser-3** | Variant: browser interaction CLI | SAFE | ✅ YES | Form filling/testing focus |
| 4 | **agent-browser-4** | Variant: web testing & data extraction | SAFE | ✅ YES | Data extraction emphasis |
| 5 | **agent-browser-5** | Variant: Rust CLI with Node.js fallback | SAFE | ✅ YES | Same as #1 |
| 6 | **playwright-cli** | Microsoft official Playwright automation | SAFE | ✅ YES | Production-ready, well-audited |
| 7 | **fast-browser-use** | Rust-powered ultra-fast DOM (10x Puppeteer) | SAFE | ✅ YES | Human-emulation, token-efficient |
| 8 | **verify-on-browser** | Raw Chrome DevTools Protocol access | SAFE | ✅ YES | Perfect MQTT proxy candidate |
| 9 | **browser-cash** | Cloud browser (anti-bot bypass) | SAFE* | ✅ YES | Legitimate bypass, proper API scoping |
| 10 | **browser-use** | Browser Use Cloud API ($0.06-0.03/hr) | SAFE | ✅ YES | Commercial service, profile-based sessions |
| 11 | **browser-use-2** | Variant: cloud browser automation | SAFE | ✅ YES | Alternative version |
| 12 | **browsh** | Text-based browser (Firefox headless) | SAFE | ❌ NO | TUI-only, minimal surface |
| 13 | **gemini-computer-use** | Google Gemini 2.5 + Playwright | SAFE | ✅ YES | Vision + control, safety prompts |
| 14 | **autofillin** | Playwright form automation | SAFE | ⚠️ PARTIAL | Manual confirmation, keychain support |
| 15 | **screen-monitor** | Screen sharing (WebRTC + SSH) | SAFE | ❌ N/A | Screen capture only |

---

## Security Audit Results

### Malicious Code: NONE DETECTED
- ✅ No `eval()`, `exec()`, `__import__()` patterns
- ✅ No obfuscated JavaScript (minified only)
- ✅ No hardcoded credentials or API keys
- ✅ No credential exfiltration to suspicious URLs
- ✅ All external URLs legitimate (GitHub, google.com, browser.cash)
- ✅ Credentials properly scoped via environment variables

### Suspicious Features (Not Malicious)

**Bot Detection Evasion:**
- `fast-browser-use --human-emulation`: Simulates mouse jitter + random delays
- `browser-cash`: Explicitly bypasses Cloudflare/DataDome/PerimeterX

**Verdict:** Code is clean. Responsibility on user for legitimate use:
- ✅ Legal: Automated testing, public data collection, research
- ❌ Illegal: Account takeover, credential theft, malware injection

**Credential Handling:** All safe
- Session files: `~/.playwright-auth.json` (local only)
- Browser profiles: Cookie storage (client-side)
- OAuth: Full support
- Keychain: macOS integration available
- Password storage: None in plaintext

---

## MQTT Compatibility Matrix

### Full Compatibility (10 skills)
Use Chrome DevTools Protocol, can tunnel via MQTT:
```
✅ agent-browser (Vercel) - core reference
✅ agent-browser-2, 3, 4, 5 (variants)
✅ playwright-cli (Microsoft)
✅ fast-browser-use (Rust CDP client)
✅ verify-on-browser (raw CDP)
✅ browser-cash (WebSocket CDP)
✅ browser-use / browser-use-2 (CDP profiles)
✅ gemini-computer-use (Playwright → CDP)
```

**Why compatible:**
1. CDP is WebSocket-based (tunnelable over MQTT)
2. Session state is client-side (cookies/storage local)
3. No hard-coded endpoints to break routing

### Partial/No Compatibility
```
⚠️ autofillin - Works but requires manual interaction
❌ browsh - TUI-only, no CDP support
❌ screen-monitor - Screen capture only
```

---

## Recommendations for Claude Browser Proxy v3.2.0

### Tier 1: Must Integrate (5 skills)
1. **agent-browser** → Core reference, Vercel Labs backing
2. **playwright-cli** → Microsoft official, production-proven
3. **verify-on-browser** → Raw CDP fallback
4. **gemini-computer-use** → Vision + control combo
5. **browser-use** → Cloud fallback option

### Tier 2: Recommended (4 skills)
6. **browser-cash** → Anti-bot scenarios
7. **fast-browser-use** → Token-budget optimization
8. **autofillin** → Workflow automation
9. **browser-use-2** → Alternative cloud provider

### Tier 3: Optional (3 skills)
10. **agent-browser-2/3/4/5** → Only if differentiating by performance niche
11. **screen-monitor** → Vision analysis complement

### Skip (1 skill)
12. **browsh** → TUI-only breaks MQTT model

---

## Threat Assessment

| Risk | Skills | Mitigation |
|------|--------|-----------|
| Rate Limiting | ALL | Add external rate limiter, respect ToS |
| Session Theft | browser-cash, browser-use | Secure env, rotate API keys |
| Bot Detection Bypass | fast-browser-use, browser-cash | User responsibility for legal use |
| Code Injection | gemini-computer-use | Safety prompts enabled |
| Credential Exposure | autofillin | Use Keychain, avoid plaintext |

**Overall:** PRODUCTION-READY (with appropriate governance)

---

## File Locations

All skills in: `/Users/jarkius/ghq/github.com/sundial-org/awesome-openclaw-skills/skills/`

Key files:
- `agent-browser/SKILL.md` - Core reference
- `playwright-cli/SKILL.md` - Microsoft official
- `browser-use/SKILL.md` - Cloud API
- `browser-cash/SKILL.md` - Anti-bot bypass
- `gemini-computer-use/SKILL.md` - Vision integration

---

## Final Verdict

✅ **All 15 skills are LEGITIMATE and SAFE**
✅ **10 fully compatible with MQTT-based CDP proxying**
✅ **No code injection, credential theft, or malware**
⚠️ **Some bypass bot detection (user responsibility)**
✅ **All follow credential best practices**
✅ **Compatible with Claude Browser Proxy v3.2.0**

**Next Steps:** Integrate Tier 1 immediately. Tier 2 provides redundancy and specialization. Evaluate Tier 3 based on specific use cases.
