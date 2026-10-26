# HCA/HSI P0 Asset Audit and My AI Boundary v0.1

**Status:** P0 audit snapshot; not a runtime QA sign-off.  
**Date:** 2026-10-26

## Executive decision

1. Build My AI as a separate, independently runnable repository/product. Life Stream, Context lifecycle, import adapters, personal-data governance, and the primary My AI experience are broader than AI Reality Quest (ARQ).
2. Keep ARQ as an independently viable experience for camera/object observations, Evidence, quests, games, and collection. Integrate through versioned adapters; do not make My AI availability a prerequisite for Quest's core loop.
3. Reuse ARQ's My AI Provider and XR bridge as seeds, not as complete implementations.
4. Stabilize the shared contract in My AI first; then create a dedicated HCA/HSI contracts repository or package. Until then, version contracts and keep a compatibility matrix.
5. GitHub holds code/specs/issues/PRs/test evidence, not private Life Stream originals or personal conversation archives.

## Repository inventory

| Repository | Observed asset | Audit status |
|---|---|---|
| rsumnet/AI_Reality_Quest_MVP_v0.1 | README identifies MVP v0.5.2; browser camera + TensorFlow.js/COCO-SSD; Evidence; quest/game modules; localStorage persistence and migrations; My AI provider scaffold; XR event bridge scaffold | README and two contract files inspected; runtime/tests not executed |
| rsumnet/BIO_MVP_v0.1 | Existing BIO MVP; prior project context says v0.2 | Detailed source/test audit not completed |
| rsumnet/HCA-HSI-Egogram-Explorer | Existing independent self-discovery module | Detailed source/test audit not completed |
| Independent My AI repository | Not present among the three repositories visible in the connected GitHub repository list | Not found in accessible list; does not prove no other repository exists |

## ARQ contracts observed

### My AI Provider scaffold

File: [core/my-ai-runtime.js](https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/blob/main/core/my-ai-runtime.js)

- Provider registration requires stable ID, name, local=true, and run(request).
- Context package schema is arq-my-ai-context/0.1.
- Only personal contexts with status CONFIRMED are included.
- Evidence is reduced to selected fields before context packaging.
- Provider availability and execution errors return structured failures.
- This is a useful adapter boundary, but a self-declared local=true does not prove network isolation, sandboxing, or data locality. README warns about this.
- It is not a Life Stream store, Context lifecycle manager, import pipeline, permissions system, or execution authorization gateway.

### XR event bridge scaffold

File: [core/xr-bridge.js](https://github.com/rsumnet/AI_Reality_Quest_MVP_v0.1/blob/main/core/xr-bridge.js)

- Versioned in-memory events use arq-xr-event/0.1.
- Subscribers can subscribe/unsubscribe; JSON-serializable payloads are cloned/frozen.
- Subscriber errors are logged and isolated.
- This is an in-process bridge, not persistent messaging, network synchronization, XR rendering, or device connectivity.

### Product/data risks documented in ARQ README

- GPS raw coordinates may be stored in arq_gps and evidence.location.gps.
- Student-authored JavaScript currently executes as trusted page script without sandboxing.
- CDN licensing/supply-chain, device permissions, minors' privacy, and deployment security need review.
- Actual local LLM integration and real XR rendering/device/network connection are not implemented.

These are README-described implementation claims, not independent runtime test results.

## Verification status

- No code was changed on the default branch in this audit.
- Automated tests were not executed.
- README documents node --test tests/*.test.cjs and GitHub Actions, but this pass did not run the test suite or verify a current successful Actions run.
- Guessed paths such as package.json and tests/migrations.test.js returned 404. This does not prove tests are absent; README documents the *.test.cjs pattern.
- Browser/device camera, GPS, migration, persistence recovery, and actual model integration remain unverified here.
- Production deployment was not verified.

## High-priority risks

1. GPS minimization: exact coordinates off by default for My AI ingestion; prefer zone/coarse location unless explicitly enabled for a specific purpose.
2. Student code execution: do not expand public/multi-user Mission Builder until execution is isolated or replaced by declarative missions and capability-limited APIs.
3. Provider trust: declare processing location, network behavior, retention, permission scopes, and capabilities. Do not send private Context merely because an adapter says it is local.
4. Preserve originals separately from normalized messages, Context candidates, Skills, and training candidates.
5. Importing into personal Context does not grant permission to publish, share, or train shared models.
6. Quest core must work when My AI, network, or XR consumers are unavailable.

## P0 exit checklist

- [x] Identify accessible repositories and main ARQ contracts.
- [x] Separate implementation claims from verified runtime behavior.
- [x] Record high-impact privacy/security risks.
- [x] Recommend repository boundary and integration approach.
- [ ] Run automated tests and inspect current CI results in an execution-capable environment.
- [ ] Browser/device smoke tests and migration/recovery tests.
- [ ] Detailed BIO and Egogram source/test audit.
- [ ] Create the independent My AI repository (requires repository creation capability or user-created empty repository).

P0 is complete as a design/asset audit snapshot, not as full execution-based QA sign-off.

## Next stage: P1

Use my-ai-life-stream-contract-v0.1.md as the starting contract. Implement the smallest end-to-end path in a new My AI repository, then add an ARQ adapter that maps selected Quest Evidence to the shared Evidence envelope. Do not move ARQ's whole application into My AI.
