# ClashPro — Implementation Roadmap (Practice vs Tournament)

> Generated: 2026-04-01
> **Your personal implementation guide for Cursor Agent**

---

## What You're Building

ClashPro is a salsa practice app that supports **two fundamental modes**:

```
┌─────────────────────────────────────────────────────────────┐
│                        ClashPro                              │
├─────────────────────┬───────────────────────────────────────┤
│   PRACTICE MODE     │       TOURNAMENT MODE                  │
│   (Current/Now)     │       (Future/Optional)                │
├─────────────────────┼───────────────────────────────────────┤
│ Timer ✅            │ Timer ✅                               │
│ Music ✅            │ Music ✅                               │
│ Rotation ✅         │ Rotation ✅                            │
│ NO voting ✅        │ Voting ✅ (NEW)                        │
│ NO points ✅        │ Points ✅ (NEW)                        │
│ NO leaderboard ✅   │ Leaderboard ✅ (NEW)                   │
│ Offline ✅          │ Offline ⚠️                              │
└─────────────────────┴───────────────────────────────────────┘
```

---

## The Three-Phase Plan

### PHASE 1: Consolidate PRACTICE MODE (This week)
**Goal**: Perfect the core experience users are already using

- ✅ Auth, setup, timer, music (already working)
- 🔄 **Task 1**: Competitor profiles + photos (Supabase Storage)
- 🔄 **Task 2**: Offline mode (PWA precaching + sync)
- 🔄 **Task 3A**: Quick wins (show battle number, "new session" button)
- **Result**: Solid, polished practice tool

**Validation**: Get feedback from 3-5 real users (Salsanamá instructors)

### PHASE 2: Add TOURNAMENT MODE (Next week)
**Goal**: Enable formal competitions with voting, scoring, history

- 🔄 **Task 3B**: Tournament quick wins (confetti, stats, WhatsApp share)
- 🔄 **Task 4**: Tournament history (Supabase, HistoryScreen)
- 🔄 **Task 5**: Result image (Canvas API, 1080x1920 vertical)
- **Result**: Full tournament + practice in one app

**Validation**: Get feedback from event organizers

### PHASE 3: Integration (Week 3)
**Goal**: Seamless switching between modes, unified feature flags

- Create `useMode.js` hook
- Add mode toggle in SetupScreen
- Adapt components (BattleScreen, MatchesScreen, LeaderboardScreen)
- Validate feature access by plan + mode combination
- **Result**: Production-ready two-mode app

---

## Feature Matrix: What Goes Where

| Feature | Practice | Tournament | Status |
|---------|----------|-----------|--------|
| **Core**: Auth, setup, timer, music | ✅ | ✅ | ✅ Done |
| **Core**: Rotation, tap-to-pause | ✅ | ✅ | ✅ Done |
| **Core**: Manual controls (+10s, skip, restart) | ✅ | ✅ | ✅ Done |
| **New**: Competitor profiles + photos | 🔄 | 🔄 | Task 1 (P1) |
| **New**: Offline mode (PWA) | 🔄 | ⚠️ | Task 2 (P1) |
| **New**: Battle number indicator | 🔄 | 🔄 | Task 3A (P1) |
| **New**: "New session" button | 🔄 | 🔄 | Task 3A (P1) |
| **Tournament**: Voting screen | ❌ | 🔄 | Task 3B (P2) |
| **Tournament**: Points/scoring | ❌ | 🔄 | Task 3B (P2) |
| **Tournament**: Confetti celebration | ❌ | 🔄 | Task 3B (P2) |
| **Tournament**: Leaderboard + stats | ❌ | 🔄 | Task 3B (P2) |
| **Tournament**: Match history | ❌ | 🔄 | Task 4 (P2) |
| **Tournament**: Share image (Stories) | ❌ | 🔄 | Task 5 (P2) |
| **Tournament**: Share by WhatsApp | ❌ | 🔄 | Task 3B (P2) |

---

## Cursor Agent Workflow

### For PHASE 1 (Do this first)

**Task 1: Competitor Profiles**
```
Model: Sonnet 4.6
Time: ~45 min
Files: CompetitorCard, CompetitorProfileModal, useCompetitors hook
SQL: Add competitor-photos bucket, add level column
```

**Task 2: Offline Mode**
```
Model: Sonnet 4.6
Time: ~30 min
Files: vite.config.js (VitePWA), useOnlineStatus hook, App.jsx banner
Deps: npm install -D vite-plugin-pwa
```

**Task 3A: Quick Wins (Practice)**
```
Model: Haiku 4.5 (3x faster, 4x cheaper)
Time: ~15 min
Files: BattleScreen, App.jsx, LeaderboardScreen
Changes: Show "Batalla 3/10" + "Nueva sesión" button
NO deps
```

**Total PHASE 1**: ~90 minutes, 3 Cursor sessions

---

### For PHASE 2 (After PHASE 1 validation)

**Task 3B: Quick Wins (Tournament)**
```
Model: Haiku 4.5
Time: ~20 min
Features: Confetti, stats (W-L-D), WhatsApp link
Deps: npm install canvas-confetti
```

**Task 4: Tournament History**
```
Model: Sonnet 4.6
Time: ~60 min
Files: useTournamentHistory hook, HistoryScreen, SQL migrations
Features: Save tournament on reset, view past results
```

**Task 5: Share Image**
```
Model: Sonnet 4.6
Time: ~45 min
Files: generateResultImage utils, LeaderboardScreen
Features: 1080x1920 PNG, Web Share API fallback
NO deps (Canvas API native)
```

**Total PHASE 2**: ~125 minutes, 3 Cursor sessions

---

## How to Use These Documents

### For Understanding the Architecture
1. **Read first**: `MODE_FRAMEWORK.md` (explains the two-mode concept globally)
2. **Reference**: `CURSOR_CONTEXT.md` (technical details of existing code)

### For Executing in Cursor
1. **Each task**: Copy the prompt from `CURSOR_PLAN.md` exactly
2. **Follow order**: PHASE 1 → validate → PHASE 2 → validate → PHASE 3
3. **Review always**: Check the diff before accepting Cursor changes

### For Making Decisions
- **"Should we add this feature?"** → Check `MODE_FRAMEWORK.md` to see if it's Practice or Tournament
- **"When should we build this?"** → Check `IMPLEMENTATION_ROADMAP.md` (this file) to see which phase
- **"What code changes are needed?"** → Check `CURSOR_PLAN.md` for the exact prompt

---

## Success Criteria

### PHASE 1 Complete When:
- [ ] Competitor profiles can be created with photos
- [ ] App works offline (no internet needed)
- [ ] Battle number shows correctly
- [ ] "New session" button works (resets matches, keeps competitors)
- [ ] 3+ real users test without complaints
- [ ] Zero errors in practice workflow

### PHASE 2 Complete When:
- [ ] Voting screen works (select winner, draw)
- [ ] Points calculated correctly (3-1-1)
- [ ] Leaderboard appears after ≥1 battle
- [ ] Confetti plays on tournament end
- [ ] Stats show W-L-D and streaks
- [ ] Image generates and can be shared
- [ ] WhatsApp link works on mobile

### PHASE 3 Complete When:
- [ ] Mode toggle works in SetupScreen
- [ ] Practice data separate from Tournament data
- [ ] Feature flags respect plan + mode
- [ ] No feature leaks between modes
- [ ] Production-ready

---

## The Key Insight (Why this plan)

**Before**: You had one app with tournament features, but users wanted to use it in practice mode.

**Now**: You build explicitly for practice first (what users actually need), then add tournament features on top (optional, premium).

**This means**:
- PHASE 1 validates the core value (practice tool works great)
- PHASE 2 adds premium features (tournaments, sharing, history)
- Your users won't feel overloaded → simpler, faster, more focused app
- Free tier gets a solid practice experience
- Pro tier unlocks tournament features

---

## Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| **1** | 1-2 days | Today | Tomorrow |
| Validation | 3-5 days | Day 2 | Day 7 |
| **2** | 1-2 days | Day 8 | Day 9 |
| Validation | 3-5 days | Day 9 | Day 14 |
| **3** | 1 day | Day 15 | Day 16 |
| Polish | 2-3 days | Day 16 | Day 19 |
| **Total** | ~3 weeks | Today | End of month |

---

## Next Actions

1. **Today**: Read `MODE_FRAMEWORK.md` to understand the global architecture
2. **Tomorrow**: Start PHASE 1, Task 1 (Cursor Agent with Sonnet)
3. **After Task 1+2**: Do Task 3A (quick wins with Haiku)
4. **Week 2**: Get real user feedback before building PHASE 2
5. **Week 3**: Build PHASE 2 if feedback is positive

---

## Questions to Ask Yourself

- **"Do I need feature X?"** → Is it Practice or Tournament? Is it PHASE 1, 2, or 3?
- **"Should Cursor implement this now?"** → Check the phase. Don't skip phases.
- **"Why separate Practice and Tournament?"** → Because users asked for it: "rondas sin ganador"

---

## Quick Reference: File Navigation

```
clash_pro/
├── MODE_FRAMEWORK.md ⭐️ READ THIS FIRST
├── IMPLEMENTATION_ROADMAP.md ← You are here
├── CURSOR_PLAN.md ← Copy prompts from this
├── CURSOR_CONTEXT.md ← Technical reference
├── MONETIZATION.md ← Business model
├── IDEAS.md ← Feature backlog
└── src/
    ├── App.jsx ← Main orchestrator
    ├── components/
    │   ├── AuthScreen.jsx
    │   ├── SetupScreen.jsx
    │   ├── MatchesScreen.jsx
    │   ├── BattleScreen.jsx ← Will change for voting
    │   ├── LeaderboardScreen.jsx ← Tournament only
    │   └── HamburgerMenu.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   ├── usePlan.js ← Feature flags
    │   └── useMode.js ← NEW (PHASE 3)
    └── lib/
        └── supabase.js
```

**When in doubt, start with `MODE_FRAMEWORK.md`.**
