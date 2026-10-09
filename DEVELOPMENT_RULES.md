# AI Reality Quest — Development & Verification Constitution

Version: 1.0  
Applies to: MVP development, debugging, testing, pull requests, and releases.

## 1. Mission

**Human decides at a higher level; AI executes while remaining controllable.**

The goal is not to maximize the human's coding output. It is to establish the minimum sufficient development literacy and control needed to direct AI reliably.

- Understand before delegate.
- Delegation is earned through evidence of reliability and verifiability.
- Build → Explain → Understand → Verify → Delegate.
- The founder is the first learner, first user, and first product testbed.

## 2. Non-negotiable development rules

1. **Evidence before diagnosis.** Separate observed facts from hypotheses. Do not state a root cause as confirmed until code, logs, or a reproducible test supports it.
2. **Define the expected behavior first.** Every bug fix must state the invariant or acceptance condition it must satisfy.
3. **Smallest sufficient change.** Fix the cause, not just the visible symptom. Do not add features, abstractions, dependencies, or duplicate state unless they materially improve correctness or testability.
4. **Inspect before editing.** Read the current branch, commit, affected code, persisted-state shape, and relevant history before proposing a patch.
5. **Protect existing behavior.** Identify nearby P0/P1/P2/P3 paths and add regression tests for behavior that must not change.
6. **AI verifies its own work.** Run syntax checks, unit tests, integration tests, version checks, and CI where applicable before asking the human to test.
7. **A failed check blocks completion claims.** Fix the failure and rerun the complete relevant suite. Never report “fixed” merely because code was changed.
8. **Human review is the exception, not the test harness.** Automate deterministic and repeatable checks. Reserve human attention for real-device behavior, product judgment, privacy/security decisions, and anything automation cannot observe.
9. **State verification limits honestly.** Passing automated tests proves only what those tests cover. Do not claim camera, GPS, model inference, browser permission, or device behavior was verified unless it was actually exercised.
10. **Keep changes reversible.** Use a branch and pull request, preserve history, describe rollback options, and never merge without explicit human approval.

## 3. Required verification pipeline

For each meaningful code change, perform the following in order:

1. **Baseline:** record branch/head SHA, current version, affected behavior, and reproduction evidence.
2. **Acceptance criteria:** write testable statements of what must happen and what must never happen.
3. **Static checks:** syntax/parse checks, version consistency, stale-version search, and basic structural checks.
4. **Unit tests:** test pure rules, boundary conditions, invalid/stale state, and both positive and negative cases.
5. **Integration tests:** exercise the actual application flow using controlled state and deterministic outcomes where practical.
6. **Regression tests:** prove adjacent behavior remains intact.
7. **CI:** require the relevant workflow to complete successfully on the exact proposed commit.
8. **Diff review:** inspect changed files, accidental scope expansion, compatibility, persistence, and error handling.
9. **Runtime smoke test:** use the actual target environment for browser/device-only behavior where available.
10. **Human handoff:** report what was tested, exact results, what remains unverified, and only the minimum necessary manual checks.

A check is not complete until its result is observed and tied to the tested commit.

## 4. AI autonomy and human approval

AI may independently inspect, edit, test, and commit low-risk, reversible changes within the agreed scope.

Human approval is required before:
- merging a pull request;
- destructive data or history changes;
- changing security, privacy, permission, or external-access policy;
- spending money or triggering consequential external side effects;
- expanding the product scope beyond the agreed hypothesis.

If a test fails, the AI should investigate and repair the failure before handing the work back. If a required capability is unavailable, it must state the exact limitation instead of pretending the check passed.

## 5. Versioning rule

- Update the **existing** visible version badge and document title on every version bump.
- Keep the app/schema version consistent with the version being tested.
- Do not add a second version display, duplicate version constant, or extra versioning mechanism merely for visibility.
- Search for stale version strings and verify the visible badge, title, schema marker, commit, and test expectations agree.
- Every versioned commit must state the version and purpose.

## 6. AI Reality Quest battle invariant

**If at least one valid Monster exists on our team, the customer must not be selected as the active fighter.**

- A pending customer turn must yield to an available team Monster.
- A draw must preserve the current opponent and resume with the same active Monster.
- A defeated Monster is removed; the next available Monster is selected.
- The customer may enter an ongoing battle only after no valid team Monster remains.
- A new battle without a pending opponent still requires the Quest precondition.
- P3 may influence only opponent selection; it must not influence our team's fighter selection.
- Persisted pending state from older versions must be normalized safely.

These conditions must be tested as state-transition cases, not only inspected visually.

## 7. Browser / Codespaces checks

Automate application syntax, game-state rules, version consistency, and log/format rules where feasible.

Keep manual runtime checks to the minimum that automation cannot faithfully reproduce:
- camera permission and live camera feed;
- on-device model loading/inference on the target device;
- GPS permission and location behavior;
- actual touch/responsive UI behavior;
- persisted state in the user's actual browser origin.

When a forwarded port fails, first distinguish the local server from the forwarding tunnel:
- verify the server responds on 127.0.0.1:<port>;
- verify the port is listed and forwarded in Codespaces;
- use the generated forwarded URL;
- do not infer an application bug from a remote 404 until local and forwarded behavior have been compared.

## 8. Completion report format

Every handoff should contain:

- **Change:** what changed and why.
- **Evidence:** the reproduction, code path, or log supporting the diagnosis.
- **Checks:** exact automated checks and pass/fail counts, tied to a commit SHA.
- **Regression coverage:** which adjacent behaviors were checked.
- **Unverified:** any real-device or environmental checks not actually performed.
- **Human action:** only the smallest remaining set of necessary checks.
- **Merge status:** explicitly state whether the PR remains unmerged.

The standard is not “AI wrote code.” The standard is **a verified, explainable, reversible change with the smallest possible human verification burden**.
