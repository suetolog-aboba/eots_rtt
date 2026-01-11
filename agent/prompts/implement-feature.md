# Prompt Template: Implement Empire of the Sun Feature (TDD)

## Purpose
Use this prompt to implement a rules feature in the Empire of the Sun module using a test-first workflow. The agent must ask questions immediately when anything is unclear.

---

## Input
- **Rules excerpt**: Part of the rules that must be implemented.
- **Additional info**: Clarifications, constraints, or context.
- **Acceptance criteria**: Optional; if omitted, treat the rules excerpt as acceptance criteria.

---

## Output
- **New tests** in `test/specs/<feature-name>.test.js`.
- **Working functionality**, verified by the new tests.
- **Feature overview** in `agent/features/<feature-name>.md` (feature specification format).

---

## Required References
Consult these files before writing tests or implementation:
- `agent/docs/empire_of_the_sun_indexed_rules.md`
- `agent/docs/testing-guide.md`
- `agent/docs/player_aid.md`
- `AGENTS.md` (repo root)

---

## Instructions to the Agent
1. **Ask questions immediately** if any part of the rules or acceptance criteria is ambiguous.
2. **Confirm the feature name** for use in filenames.
3. **Write tests first** in `test/specs/<feature-name>.test.js` using the helpers and harness in `test/helpers.js` and `test/harness.js`.
4. **Run the tests** to confirm they fail before implementation.
5. **Implement the feature** in `rules.js` (or source of truth if `rules.txt` exists).
6. **Run tests again** until all new tests pass.
7. **Run smoke tests** to ensure no regressions.
8. **Create feature documentation** at `agent/features/<feature-name>.md`.
9. **Summarize any assumptions** made during implementation.

---

## Test Writing Guidelines
- File naming: `test/specs/<feature-name>.test.js`
- Use the helpers from `test/helpers.js`:
  - `assert`, `assertEqual`, `assertDeepEqual`, `assertThrows`
  - `setupGame`, `playUntil`, `randomChoice`
- Use the harness from `test/harness.js`:
  - `harness.setup`, `harness.view`, `harness.action`, `harness.listActions`
- Prefer direct state setup only when a stable in-game path is impractical.

---

## Feature Overview File Format
Create `agent/features/<feature-name>.md` with the following sections:

```md
# Feature: <feature name>

## Rules Reference
- <rule section number and title>

## Acceptance Criteria
- <criterion 1>
- <criterion 2>

## Implementation Summary
- <short description of changes>

## Tests Added
- `test/specs/<feature-name>.test.js`

## Files Modified
- `rules.js`
- <any others>

## Assumptions / Open Questions
- <list any assumptions or remaining questions>
```

---

## Completion Checklist
- [ ] Ambiguities clarified with user
- [ ] New tests written and failing first
- [ ] Feature implemented
- [ ] New tests passing
- [ ] Smoke tests passing
- [ ] Feature documentation created
