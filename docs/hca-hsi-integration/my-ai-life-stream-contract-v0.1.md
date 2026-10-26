# My AI Life Stream & Context Contract v0.1

**Status:** Proposed contract for P1 implementation.  
**Date:** 2026-10-26  
**Principles:** local-first; AI organizes, human commits; preserve original traces; Core + Experience; Independent Viability Contract.

## 1. Product boundary

My AI owns Life Stream capture, source preservation, conversation import, normalized records, Evidence/provenance, Context lifecycle, timeline/search/review/export/recovery, and provider/skill adapters behind explicit policies.

ARQ owns camera/object recognition, Quest Evidence, missions, games, and collection. It may export user-selected Evidence to My AI through a versioned adapter.

My AI must remain useful without ARQ. ARQ must remain useful without My AI.

## 2. Recommended data architecture

Use versioned, append-preserving records, not one mutable “memory” table. For a browser-first MVP, use IndexedDB for application records and blobs; use SQLite as a future desktop/local-service storage adapter. Export/import uses versioned JSONL plus separate binary assets. Do not store Life Stream originals in browser localStorage.

### Logical layers

1. **Original** — imported file or captured raw text/audio/transcript, immutable after ingestion. Corrections add a revision/annotation, not silent overwrite.
2. **Source / Import Job** — source identity, file hash, parser version, status, duplicates, errors, consent/scope.
3. **Normalized Event** — messages, notes, observations, timestamps, actor/role, thread/order, and original pointer.
4. **Evidence / Claim** — observation or assertion with provenance, confidence, and temporal scope.
5. **Context Candidate** — AI interpretation awaiting user review.
6. **Verified Context** — user-confirmed or explicitly accepted Context with validity interval, scope, and source links.
7. **Skill Candidate / Training Candidate** — separate downstream products; accepting Context does not implicitly authorize training.
8. **Audit/Event Log** — state transitions, corrections, consent changes, export/deletion requests, and job results.

### Common record envelope (illustrative)

~~~json
{
  "id": "urn:uuid:<stable-id>",
  "record_type": "original|normalized_event|evidence|context_candidate|context|skill_candidate|training_candidate",
  "schema_version": "hca-hsi-record/0.1",
  "created_at": "ISO-8601 UTC",
  "observed_at": null,
  "valid_from": null,
  "valid_to": null,
  "source": {
    "source_id": "stable-source-id",
    "source_type": "manual|chatgpt_export|gemini_export|claude_export|claude_code|arq",
    "source_record_id": null,
    "import_job_id": null,
    "original_sha256": null,
    "parser_id": null,
    "parser_version": null
  },
  "content": {},
  "provenance": {
    "derived_from": [],
    "extractor": null,
    "model": null,
    "method": null
  },
  "state": "raw|normalized|candidate|confirmed|superseded|withdrawn|deleted",
  "scope": {
    "owner_id": "local-user",
    "visibility": "private",
    "allowed_uses": ["personal_context"],
    "share_opt_in": false,
    "training_opt_in": false
  },
  "revision": 1
}
~~~

Production schemas should validate each record type and reject unsafe/unrecognized fields rather than accept arbitrary payloads.

### Minimum entity set

- **OriginalArtifact:** immutable bytes/text, hash, MIME/type, source, created/imported time, storage metadata.
- **ImportJob:** source, adapter/version, status, counts, duplicate decisions, parse failures, consent/scope snapshot.
- **StreamEvent:** normalized text/message/observation with time, actor/role, conversation/thread, ordering, original reference.
- **Evidence:** what was observed/claimed, by whom/what, when, source, confidence, location precision, provenance.
- **ContextItem:** subject, predicate, value, domain, status, confidence, valid-time and observed-time intervals, source links, review decision, supersedes/superseded-by.
- **SkillCandidate:** reusable procedure/capability hypothesis, examples, evaluation status, version.
- **TrainingCandidate:** curated example, rights/consent, de-identification, evaluation split, opt-in status; separate from personal Context.
- **ConsentGrant:** purpose, source scope, fields, processor/model destinations, expiry, revocation time, policy version.
- **AuditEvent:** actor, operation, affected IDs, previous/new state, time, result, correlation ID.

### Context lifecycle

RAW → NORMALIZED → CANDIDATE → CONFIRMED → ACTIVE

Alternative transitions: CANDIDATE → REJECTED; ACTIVE → SUPERSEDED, EXPIRED, or WITHDRAWN. Preserve history and source links. User correction supersedes earlier Context rather than erasing the inference history. Deletion requests must remove or render inaccessible the relevant private source/derived records according to the product's deletion policy, including derived indexes/caches, and provide an auditable completion report without retaining deleted content.

Never treat a model confidence score as human confirmation. Contradictions remain explicit and queryable; do not silently pick one.

## 3. MVP storage and indexing

- Browser PWA: IndexedDB stores normalized records and small artifacts; larger files use Blob records with limits and import warnings.
- Search: deterministic full-text search and filters first. Add embeddings only after provenance, deletion, and recovery work.
- Future local desktop/service: SQLite with migrations, foreign keys, transactions, full-text search, and optional vector extension.
- Backup: versioned JSONL manifest plus original artifacts, checksums, restore validation, and dry-run summary.
- Do not claim browser storage is encrypted by default. Document the device threat model and offer encrypted backup/export before multi-device sync.
- No server sync in first MVP. Later sync must be opt-in with reviewed security, conflict, and restore behavior.

## 4. Conversation import scope for first MVP

### Include in the first implementation path

1. Manual text / Thought Fragment capture.
2. Generic .txt, .md, .json, and .jsonl import with preview and explicit mapping for unknown structures.
3. ChatGPT export ZIP with conversations.json; preserve the original archive and parse supported conversation/message fields.
4. Claude Code local conversation JSONL when the user explicitly selects files/folders and confirms scope.
5. Import preview showing source, date range, estimated records, duplicates, parse errors, unsupported attachments, and stored fields.
6. Idempotency via stable source IDs where available; otherwise content hashes and reviewable duplicate candidates.
7. Per-source import report, cancellation, retry, and export/restore.

### Adapter interface now; provider-specific parsers in tested increments

- Gemini Takeout and Claude account export should be dedicated adapters, but mark each “supported” only after a real sample fixture is parsed and tested. Export formats can vary by route/version.
- **MVP release scope:** file-based import adapters for ChatGPT export, Gemini Takeout/export, Claude account export, and user-selected Claude Code JSONL, plus generic TXT/MD/JSON/JSONL. Implementation is staged: first make the adapter framework and ChatGPT/generic path pass; then add Gemini, Claude, and Claude Code adapters using real sample fixtures. Do not declare the MVP import requirement complete until all four named sources have fixture-based tests and a user-facing import report. If an export variant cannot be parsed, preserve the original, report the unsupported fields, and offer generic import where practical. Do not promise faithful support for every attachment, voice payload, branch, or historical export variant in v0.1.
- No account scraping, password collection, browser-cookie access, or undocumented private API calls in the first MVP.
- No live email, KakaoTalk, Slack, Instagram, or web-account connectors in the first MVP. Later integrations must use supported APIs/authorized exports, narrow scopes, consent, rate limits, retention rules, and revocation.
- Importing grants permission only for selected personal-use purposes. Sharing, publication, model training, and cross-user learning require separate explicit opt-in and rights review.
- Never upload private exports to a public GitHub repository or public Hugging Face dataset/Space.

## 5. Provider / Skill / Adapter boundaries

- **Context:** user-specific information with provenance and lifecycle.
- **Skill:** reusable, versioned procedure/tool capability with input/output schema, permission scope, tests, rollback/disable path.
- **Adapter:** connects a provider/source to a stable contract.
- **Model adapter/QLoRA:** changes model behavior; later optimization, not the first personalization mechanism.
- Personal Context is private by default. Shared model training is off by default and requires separate revocable consent and data-rights checks.
- Provider declares processing location, network access, retention, capabilities, version, and permissions. “Local” is a claim to validate, not proof of isolation.

## 6. ARQ Evidence mapping

ARQ's arq-my-ai-context/0.1 is a product-specific provider request format, not the canonical storage schema. Add a versioned adapter:
- Input: user-selected ARQ Evidence IDs/fields and explicit consent.
- Output: canonical Evidence/StreamEvent envelope with source_type=arq, ARQ source IDs, timestamps, processing/model metadata, and provenance to the original ARQ record.
- GPS: omit exact coordinates by default; include only if explicitly enabled for a defined purpose. Prefer zone/coarse location.
- Never overwrite ARQ Evidence with derived Context.
- If My AI import/adapter fails, ARQ remains operational; show a recoverable failure and permit retry/export.

## 7. Independent Viability Contract

Every module declares and tests:
- Standalone inputs/outputs, UI, storage ownership, export/recovery.
- Dependencies and behavior when each dependency is absent.
- Permission requests/data scopes; deny-by-default for sensitive scopes.
- Error boundaries, visible failure reason, recoverable action, and human-readable fallback.
- Versioned API/schema compatibility and migration/rollback.
- Clean install, upgrade, corrupted data, dependency unavailable, permission denied, export/restore, disable/uninstall tests.
- Integration extension points that do not require the whole platform.

## 8. First My AI runnable path

capture/import → preserve original → normalize event → propose Context → human review → confirm Context → answer a question with source links → export/restore

Voice capture, cloud sync, embeddings, QLoRA, XR rendering, and live connectors are not required to prove this first path.

## 9. Acceptance tests for first-run completion

### Data integrity
- Imported original exports byte-for-byte or with documented container-level normalization; hash matches.
- Every normalized event and Context candidate links to source records/originals.
- Re-importing the same file does not silently duplicate all messages; duplicate decisions are reported.
- Invalid/truncated files fail safely without corrupting already imported records.
- Schema migration preserves records; backup restore reconstructs a usable workspace.

### Context quality/control
- AI-generated Context starts as a candidate, never silently confirmed.
- User can confirm, edit, reject, supersede, and withdraw Context.
- Conflicting Contexts coexist with provenance/validity dates; system signals conflict.
- Answers can show which Context/source records informed them.
- Withdrawn/deleted Context is absent from active retrieval, including derived indexes/caches per policy.

### Privacy/security
- No network request during the declared offline-only path, verified via browser network inspection.
- Import destination and purpose are visible before commit.
- Share/training permissions default false and are independent from personal-context consent.
- Exact GPS is excluded by default from ARQ transfer.
- No secrets/private conversation data in GitHub logs, telemetry, or public assets.
- Permission denial/missing provider does not break local capture, review, export.

### Independent operation/integration
- My AI works without ARQ and supports capture, search, Context review, export/restore.
- ARQ works without My AI and retains its core game/Evidence path.
- Adapter failure is visible/recoverable and cannot corrupt ARQ records.
- Missing provider gives a clear fallback, not a crash.
- Fixture-based import tests pass for ChatGPT export, Gemini export, Claude account export, and Claude Code JSONL; generic TXT/MD/JSON/JSONL paths are covered. Declared automated tests pass in CI; browser smoke tests cover supported desktop and mobile browsers.

### Release decision
First run is complete only when critical tests pass, a versioned test report is saved, known limitations are documented, and clean install + restore smoke test is demonstrated. “The page opened” or “the model answered once” is insufficient.

## 10. Inter-agent coordination and handoff

Every handoff includes:
- Goal/non-goals.
- Contract version and exact repo/branch/commit.
- Files changed and rationale.
- Tests run, exact command, result, environment; never report unrun tests as passing.
- Evidence links/logs, unresolved risks, decisions required.
- Next task, acceptance criteria, rollback path.

GitHub Issues track work; branches/PRs hold proposed changes; Actions hold repeatable test evidence. MCP can provide tool interoperability where supported, but do not assume one ChatGPT conversation can directly message another. Until a shared coordinator exists, repository/issue/PR records are the durable message bus and the user can copy a concise handoff when a chat lacks access.
