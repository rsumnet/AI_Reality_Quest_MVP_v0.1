# AI Reality Quest — GPT Handoff Package

**Prepared:** 2026-10-11  
**Purpose:** Transfer project intent, verified state, design constitution, roadmap, and working instructions to a new GPT so it can continue development without relying on the previous chat.

> This document is a map, not a substitute for the live repository. Before editing, inspect the current default branch, code, tests, CI, and recent commits. If this document conflicts with the code, report the discrepancy and establish the actual current state from evidence.

## 1. Start here

- **Repository:** https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1
- **Default branch:** `main`
- **Latest merged app version:** `MVP v0.5.0` (PR #7 merged and GitHub Pages deployment workflow succeeded on 2026-10-19; direct live-page version confirmation remains pending). v0.5.1 storage migration is being prepared on branch `v0.5.1-storage-migration`; do not merge until the user completes the final browser/device check and explicitly approves.
- **Latest merged change:** PR #7, merge commit `d1f56f4ca9b7d57de1e64b9984bb92928fa139d5` on 2026-10-19.
- **Merged PR:** https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/pull/7
- **PR head tested by CI:** `66e29465fd377a8d2030b58b7ccd7bcf6c7673f2`.
- **CI:** “Verify MVP” main push run #76 / ID `39189402044` succeeded after merge; PR run #75 passed 37/37 tests.
- **Pages:** build/deployment run #16 / ID `39189401919` succeeded on merge commit `d1f56f4ca9b7d57de1e64b9984bb92928fa139d5`.
- **User preview check:** user confirmed v0.5.0 displayed and Yut + 4×4 Sudoku worked in Codespaces preview. Direct live Pages check remains pending.
- **User runtime check (2026-10-18):** The user confirms completing all game tests on a smartphone; all game tests were reported normal. Device model, OS, and browser version were not recorded.
- **User Pages check (2026-10-19):** The user confirmed the live page continued to show v0.4.8 after refresh. The v0.4.9 Pages workflow has now succeeded on the merge commit; direct user-visible v0.4.9 confirmation is still pending.
- **Automated release check:** The v0.4.8 ZIP previously passed 32 isolated Node tests; this is not a substitute for GitHub Actions.
- **Still not proven by automated tests:** camera permission/live feed, actual on-device model inference, GPS permission/location behavior, touch/responsive behavior on target devices, and persistence behavior across real browser origins.

The current source of truth is the repository, especially:
1. `DEVELOPMENT_RULES.md` — development constitution and verification contract.
2. `README.md` — current product summary (review/update when it diverges from implementation).
3. `index.html` — current single-page host/core and UI.
4. `games/game-registry.js`, `games/rps.js`, `games/odd-even.js`, `games/dice.js` — replaceable game system.
5. `tests/` and `.github/workflows/verify.yml` — automated regression suite and CI.

## 2. Product mission and thesis

**Product name:** AI Reality Quest  
**Tagline:** “AI에게 세상을 가르치고, AI와 함께 세상을 탐험한다.”  
**Core idea:** Teach AI about the world through real-world observations, then explore that world with AI.

The project is not meant to begin as a large AR/XR game. The strategy is:

> Build the smallest Reality Quest engine that could eventually become a much larger world-exploration platform.

The initial vertical slice is:

**Reality → Camera → On-device AI → Evidence → Object identity/confirmation → Collection → Personal Context → My AI → P3 rule engine → Quest → Replaceable Game → Monster / battle history → Learning**

The real world is the source of evidence and learning. Games are a replaceable motivation/interaction layer, not the product's core identity.

### Core user promise

- Observe real-world objects.
- Save observations as evidence, not as untraceable guesses.
- Accumulate evidence and conservatively confirm object identity.
- Let the human approve Personal Context; AI may suggest but must not silently decide what matters personally.
- Use My AI context and past history to alter future behavior in a visible, explainable way.
- Preserve learning and user history if the game mechanic or AI model is replaced.

## 3. Strategic business context: AI development conductor

The founder's broader business thesis is relevant to how this project should be developed:

- **“Human decides at a higher level; AI executes while remaining controllable.”**
- In the AI-coding era, the human's goal is not to maximize coding skill, but to acquire the **minimum sufficient development literacy needed to direct AI**.
- The founder is the first learner, first user, and first product testbed.
- Preferred cycle: **Build → Explain → Understand → Verify → Delegate**.
- Understand before delegating; autonomy is earned through evidence of reliability and verifiability.
- Reduce the human's repetitive checking burden without pretending that real-world/device behavior has been tested when it has not.

Do not turn this into a code-first workflow. The AI should inspect the whole system, make a bounded plan, implement, run the checks, inspect the diff, and present only the remaining human decisions/checks.

## 4. Non-negotiable development constitution

Read `DEVELOPMENT_RULES.md` in full before making changes. Its key rules are:

1. **Evidence before diagnosis.** Separate observed facts from hypotheses. Do not declare a root cause confirmed until supported by code, logs, or a reproducible test.
2. Define expected behavior/invariants before patching.
3. Inspect current branch, head SHA, affected code, persisted state, and relevant history before editing.
4. **Trace the complete connected behavior chain.** A requested change includes all affected state writers/readers, transitions, UI messages, persistence, history, statistics, and downstream rules—not only the named line.
5. Fix the cause with the smallest sufficient change; preserve unrelated behavior.
6. Add regression tests for the requested behavior and adjacent invariants.
7. Run static checks, unit/integration/regression tests, version consistency checks, and CI on the exact proposed commit.
8. A failed check blocks a completion claim. Repair it and rerun relevant tests.
9. Human review is not the test harness. Automate deterministic checks; reserve human attention for device-only behavior, product judgment, privacy/security, and unautomatable decisions.
10. State limitations honestly. Do not claim camera, GPS, inference, or device behavior was tested unless it actually was.
11. Keep changes reversible through branches/PRs and explain rollback options.
12. **Never merge a PR without explicit user approval.** The user approved PR #4 only; this does not authorize future merges.

### Required completion report

Every meaningful change must report:
- Change and rationale.
- Evidence supporting diagnosis.
- Exact checks/results and commit SHA.
- Regression coverage.
- What remains unverified.
- Minimum necessary human action.
- Merge status.

## 5. Current architecture

### Shared core/host — not game-specific

The shared core owns:
- Reality Scanner / camera input.
- Evidence creation and persistence.
- Physical object identity and confirmation.
- Personal Context and My AI state.
- P3 rule evaluation and opponent selection.
- Quest eligibility and Quest objects.
- Monster Collection mutations.
- Battle lifecycle, battle history, persistence, and statistics.
- Applying normalized game outcomes.

### Replaceable game modules

Registered through `window.ARQGameRegistry`. Current modules on merged `main` (v0.4.9):
- `games/rps.js` — Rock Paper Scissors.
- `games/odd-even.js` — Odd/Even.
- `games/dice.js` — Dice.

The merged v0.5.0 release includes `games/yut.js` and `games/sudoku.js`; the user confirmed both games work in the Codespaces preview, and the Pages deployment workflow succeeded. Direct production-page confirmation remains pending.

The game selector allows the user to change the game module. The user tested this in the actual browser and confirmed switching works.

Module contract (see `DEVELOPMENT_RULES.md` for full version):
- Stable unique `id`, display `name`, short `description`.
- `renderControls(container, onAction, context)` renders game UI and reports an action/outcome.
- Optional `resolveRound(action, context)` returns a normalized result.
- Normalized result is one of `WIN`, `LOSE`, `DRAW`; game-specific actions/details can be stored in metadata.
- Async games (e.g. Sudoku) may submit a normalized outcome when the task is completed/failed.
- Host/core remains responsible for collection changes, P3, battle history, and persistence.

**Never** duplicate Reality Scanner, Evidence writes, My AI memory, P3 rules, Monster Collection mutations, or localStorage persistence inside a game module.

### Current object/Quest/battle invariants

- At least one valid Monster on our team means the customer must not be selected as active fighter.
- A draw preserves the same actor and opponent and continues the same battle.
- A defeated collected Monster is removed; the next available Monster is selected.
- The customer enters the ongoing battle only when no valid team Monster remains.
- P3 can affect only the **opponent-team Monster selection**, never the active Monster from our own team.
- P3 must not prioritize an object just because it is recognized or captured for the first time.
- P3 may prioritize a confirmed Personal Context object only after that exact team's Monster was defeated, removed from Collection, and the same object is later re-observed for a new Quest.
- Confirmed object status must not be revoked by a later low-confidence observation after cumulative evidence has passed the 75% confirmation threshold.
- Legacy pending battle state from older versions must be normalized safely.
- Battle history must distinguish losing our collected Monster from failing to capture the opponent.

### My AI loss-history fix in v0.4.7

Previously, the internal statistic `ownMonsterLosses` tracked the event, but the user-facing aggregate `missed` count did not include a loss of an already-collected Monster. It only represented failure to capture the opponent. This caused the user's first captured My AI Monster being defeated to look like no missed/lost event.

The merged fix:
- Counts collected-Monster loss in the aggregate `missed` total.
- Keeps `opponentMisses` and `ownMonsterLosses` separate for diagnosis and P3 semantics.
- Persists the actor physical-object ID, a readable `missed` entry, and `lostFromCollection` metadata.
- Regression tests verify removal from Collection, persisted Battle History, correct object ID, and exactly-once increment.

## 6. Current implementation and verification

### Merged baseline v0.4.9

### v0.5.0 merged release (PR #7)

- Adds `games/yut.js` and `games/sudoku.js`; shared core and battle lifecycle remain unchanged.
- Keeps the v0.4.9 P3 regression coverage and adds two game-module contract tests.
- PR head: `3848bbe08b6a9be5420a40378ec3e3e2369a1547`.
- GitHub Actions run #74 / ID `39183338584`: **37/37 tests pass**.
- An earlier candidate CI run failed on a test-file syntax error; the extra closing brace was removed and the full suite passed on the exact head above.
- PR link: https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/pull/7.
- **User final check passed in Codespaces preview:** v0.5.0 visible, Yut works, Sudoku works. PR #7 was then merged with explicit user approval; Pages run #16 succeeded. Direct live Pages version check remains pending.

### Automated tests cover

- Battle draw continuity.
- Shared collection/battle lifecycle.
- Collected-Monster loss persistence and aggregate stats.
- Game registry.
- RPS, Odd/Even, Dice outcome handling.
- Module UI callbacks.
- A student-created asynchronous game submitting a normalized outcome.
- Version/title/badge/schema consistency.

### Explicitly unverified / needs re-check when relevant

- Camera permission and live camera feed on target browser/device.
- TensorFlow.js / COCO-SSD model loading and actual inference on target device.
- GPS permissions and zone behavior.
- Mobile touch/responsive behavior and performance.
- Browser-origin-specific localStorage/persistence behavior.
- Privacy, child/guardian consent, security, and production licensing.
- Student-created arbitrary JavaScript currently runs as trusted page script; do not expose arbitrary untrusted student code publicly without sandboxing/isolation and security review.

## 7. Suggested roadmap

Treat this as a **proposed sequence**, not a promise or a fixed delivery schedule. Validate each phase before expanding scope.

### Phase 0 — Stabilize the current vertical slice

1. Confirm `main` contains the merged v0.4.9 change and the repository is clean/consistent.
2. Run the full test suite and check CI against current `main`.
3. Verify version title/badge/schema and remove stale version strings.
4. Perform a concise browser smoke test for the end-to-end flow: camera → scan → Evidence → confirmation → Quest progress → three objects → game selector → battle outcome → Collection/History.
5. Specifically verify the first-capture / loss / re-observation P3 sequence:
   - first capture alone does not trigger P3;
   - losing a collected Monster is recorded exactly once;
   - the same confirmed object is later re-observed and is eligible for P3 in a new Quest;
   - P3 affects the opponent only.
6. Verify low-confidence later observations do not reduce confirmation status or incorrectly reduce collection/Quest counts.
7. The v0.4.9 regression suite also exercises real Evidence statistics, confirmation, Battle History, and P3 rules together: one observation is insufficient; re-observation alone is insufficient; the same object becomes eligible after its own Monster loss; later low-confidence Evidence does not revoke prior confirmation. The user confirmed smartphone game-module testing on v0.4.8, not yet on v0.4.9.
8. Ensure WIN, LOSE, DRAW messages identify both participants and the game result clearly.
9. Record actual browser/device findings separately from automated CI results.

### Phase 1 — Make the core reliable and explainable

- Formalize Evidence, physical-object identity, confirmation, Personal Context, My AI, and battle-history schemas.
- Make state transitions and invalid/stale state handling explicit and testable.
- Improve the quality/traceability of object identity without falsely claiming robust real-world object re-identification; current visual fingerprinting is MVP-level and conservative.
- Make rule decisions explainable: show whether P3 acted, what it selected, why, and what evidence/history triggered it.
- Preserve user history and preferences across game-module replacements.
- Add migration tests for old localStorage state/schema versions.
- Make failures actionable: explain the cause; offer one-tap recovery when possible; otherwise provide concrete self-fix steps; escalate only when neither is adequate.

### Phase 2 — Extend the replaceable mission/game system

- Add further games through the same contract (examples: Yut, Sudoku, student-created games).
- Keep educational object recognition and My AI learning independent of the chosen game.
- Establish module metadata, version compatibility, timeout/error handling, invalid-result handling, and graceful recovery.
- Sandbox untrusted student-authored code before public classroom deployment. Do not confuse “easy to add a module” with “safe to execute arbitrary code”.
- Consider a Mission Builder only after the shared contract and state lifecycle are stable.

### Phase 3 — Expand learning and mission capabilities

Potential order (validate by experiment, not assumption):
1. Mission Builder using declarative rules.
2. Python Mission only with a safe, bounded execution model.
3. My Character / character progression.
4. Reality Map / zone-based discovery.
5. Student-generated missions and shareable modules with moderation and safety boundaries.

### Phase 4 — Longer-term platform direction

Only after the smallest engine is reliable:
- AR, then XR.
- Multiplayer.
- Physical agents/robots.
- Replaceable base AI layer across future Android/on-device and Apple/on-device AI systems.
- Keep Evidence, Context, Rules, Preferences, History, and Feedback independent from the base model/provider so platform changes do not erase the user's accumulated assets.

### Cross-cutting privacy and safety

- Prefer object, pose, and gesture tasks over face/emotion recognition.
- Minimize raw video and precise GPS retention; keep zones where sufficient.
- Do not store raw GPS in localStorage unless there is a reviewed, explicit need; current README states GPS is converted to Zone and raw coordinates are not stored in localStorage, so inspect actual code before relying on that claim.
- Before deployment to children/classrooms, review consent, data retention, teacher/guardian controls, security, accessibility, model/CDN licensing, and incident handling.
- Keep security/privacy changes subject to human approval.

## 8. How the next GPT should work

At the start of a new chat:
1. Read this document.
2. Inspect the live repository and `DEVELOPMENT_RULES.md`; verify default branch and latest commit.
3. Summarize actual current status in a compact checklist, distinguishing **verified / likely / unknown**.
4. Ask a question only if a genuinely consequential product decision is missing. Do not ask the user to repeat details already in the repo or this handoff.
5. For any requested change: trace all affected code paths first, write acceptance criteria, implement the smallest complete fix, add tests, run the full relevant suite and CI, review the diff, and report only remaining human checks.
6. Never merge without explicit approval, even if tests pass.
7. Do not make up files, test results, browser behavior, or current Git state. If a connector/tool cannot inspect something, say so.

### Commands useful in a Codespace

```bash
git status --short --branch
git branch --show-current
git log -5 --oneline --decorate
node --test tests/*.test.cjs
```

Use the repo's current documented server/run instructions after inspecting the current files. For camera and GPS, use localhost/HTTPS as appropriate; do not diagnose a forwarding tunnel problem as an app bug until local and forwarded behavior are compared.

## 9. Final outputs expected from the next GPT

The project's end goal is not just “more code”. The work should produce:

1. **A reliable, explainable Reality Quest engine** with a verified end-to-end core loop.
2. **A stable core/game-module boundary** so new games can be added/removed without breaking Evidence, Personal Context, My AI, P3, Collection, history, or persistence.
3. **A tested My AI learning loop** that records loss accurately and uses context/history to change future opponent selection only under the intended conditions.
4. **A regression suite and CI evidence** tied to exact commits, including migration/state-transition tests.
5. **A browser/device verification record** that clearly distinguishes real-device checks from automation.
6. **Updated living project documentation**: README, development constitution, architecture/module contract, roadmap, and known limitations.
7. **A clear next-step recommendation** backed by observed user behavior and tests, not a premature feature expansion.
8. Eventually, a modular Reality Quest platform that can evolve through missions, games, maps, AR/XR, multiplayer, and physical agents while preserving user-owned Evidence/Context/Rules/Preferences/History/Feedback.

## 10. Copy/paste prompt for the new GPT

You are taking over the AI Reality Quest project described in this handoff document. Your first job is to understand the live repository, not to start coding immediately.

Read `HANDOFF_NEXT_GPT.md`, `DEVELOPMENT_RULES.md`, and `README.md`. Inspect the current default branch, recent commits, tests, and CI. Then report:
- what is verified as working;
- what is implemented but not verified in a real browser/device;
- what is still unknown or potentially inconsistent;
- the three highest-value next actions and why.

Preserve the project mission: “AI에게 세상을 가르치고, AI와 함께 세상을 탐험한다.” Keep the core independent from replaceable games and AI providers. Human decides at a higher level; AI executes while remaining controllable.

Follow the full development constitution. For each requested change, trace the entire connected behavior chain—state writers/readers, transitions, UI, persistence, history/statistics, and downstream rules. Define acceptance criteria, implement the smallest complete fix, add regression tests, run all relevant tests and CI on the exact commit, inspect the diff, and clearly state what was not tested. Do not ask the human to repeat information already available. Never claim a test passed without observing the result. Never merge a PR without explicit user approval.

Do not expand to AR/XR or other large features before stabilizing the smallest engine. The current main release is v0.5.0 (PR #7 merged, CI and Pages deployment succeeded). The next candidate is v0.5.1 localStorage migration on PR #8; run CI on the exact latest head, review the diff, and never merge until the user completes the final browser/device check and explicitly approves.


## Current handoff update — 2026-10-19

- v0.5.0 is merged and Pages deployment workflow #16 succeeded on `d1f56f4ca9b7d57de1e64b9984bb92928fa139d5`.
- User has not yet confirmed the production Pages URL itself displays v0.5.0; this is part of the next minimal manual check.
- v0.5.1 is being prepared on `v0.5.1-storage-migration` to add versioned localStorage migration while preserving Evidence, Monsters, Battles, Personal Context, and Quest progress. Migration tests are being added for legacy Quest-object strings, idempotence, malformed JSON non-overwrite, and schema marker behavior.
- Never merge v0.5.1 without explicit user approval after the final browser/device test. Expected next manual check: verify v0.5.0 live production page first, then preview v0.5.1 with pre-existing localStorage data and confirm counts/history/context survive refresh.
