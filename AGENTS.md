# AGENTS.md

## Scope
- Repository: Empire of the Sun module for Rally-the-Troops.
- Primary languages: JavaScript, HTML, CSS, plus custom GDL macros.
- Target runtime: browser for UI files, Node.js for tooling.
- Content is mostly static assets plus rules engine logic.

## Commands (Build/Lint/Test)
- No formal lint or test runner exists in this repo.
- Build artifacts are typically pre-generated and checked in.
- Manual verification is common; see Rally-the-Troops server docs.

### Build / Generate
- `make`
- Builds `rules.js` using `tools/compile.js` when `rules.txt` exists.
- Requires `cpp`, `node`, and the source `rules.txt` or `gdl-rules.txt` files.
- `node tools/compile.js /path/to/rules.txt > rules.js` is the direct script.

### Watch
- `make watch`
- Rebuilds when `rules.txt` or `tools/compile.js` changes.
- Uses `inotifywait` (Linux package `inotify-tools`).

### Single Test / Single Script
- No automated tests exist, so a single test command is not applicable.
- Use targeted manual checks in the browser or via the server.
- If you add tests in future, document the command here.

### Lint / Format
- No repo-provided lint or formatter.
- Avoid introducing new formatting tools unless requested.

## Project Layout
- Root HTML/CSS/JS files power the game UI in the browser.
- `rules.js` contains the core game logic for the server runtime.
- `data.js` holds game data structures for cards, pieces, and map.
- `tools/` contains compiler utilities and GDL documentation.
- `agent/docs/` hosts AI reference materials like `empire_of_the_sun_indexed_rules.md` and `player_aid.md`.
- `cards/`, `pieces/`, `markers75/`, and images are assets.
- `layout.js` and `world.js` implement UI helpers and custom elements.
- `play.js` wires up gameplay interactions and rendering.

## Rally-the-Troops Server Integration
This module runs on the Rally-the-Troops (RTT) server located at `/home/aboba/workspace/projects/server/`. Understanding the server framework is essential for modifying game logic.

### Required Module Exports (rules.js)
- `exports.roles` - Array of player roles: `["Japan", "Allies"]`
- `exports.scenarios` - Array of available scenarios.
- `exports.setup(seed, scenario, options)` - Creates initial game state, returns state object.
- `exports.view(state, role, is_replay)` - Generates client view, hides secret info from opponents.
- `exports.action(state, role, verb, noun)` - Handles player actions, returns updated state.

### Framework Global Variables
- `G` - Global game state object (the single source of truth).
- `L` - Local state scope for current procedure.
- `R` - Current role index (0=Japan, 1=Allies).
- `V` - View object being constructed for the client.
- `P` - Procedures/states table defining game flow.

### State Management Functions
- `call(name, env)` - Enter a new state/procedure.
- `goto(name, env)` - Replace current state with another.
- `end(result)` - Return from current state to caller.
- `finish(result, msg)` - End the game with a result.

### View and Prompt Functions
- `prompt("text")` - Set the prompt text shown to player.
- `action("verb", noun)` - Add a valid action the player can take.
- `button("label")` - Add a button action.
- `log("message")` - Append to the game log.

### Undo Management
- `push_undo()` - Save state for undo (call at start of action handlers).
- `clear_undo()` - Clear undo stack (required before random rolls or revealing hidden info).
- `pop_undo()` - Restore previous state.

### Random Number Generation
- `random(range)` - Returns 0 to range-1. Always use this, never `Math.random()`.
- `shuffle(array)` - Fisher-Yates shuffle using the seeded RNG.

### Data Structure Helpers (sorted arrays)
- `set_add(set, item)`, `set_has(set, item)`, `set_delete(set, item)` - Set operations.
- `map_set(map, key, value)`, `map_get(map, key, missing)`, `map_has(map, key)` - Map operations.

### State Definition Pattern
```javascript
P.example_state = {
    _begin() {
        L.count = 3  // Initialize local scope
    },
    prompt() {
        prompt("Select an option")
        for (let x of valid_options)
            action("select", x)
        button("done")
    },
    select(x) {
        push_undo()
        do_something(x)
        if (--L.count === 0)
            end()
    },
    done() {
        end()
    }
}
```

### Server Documentation
Full server docs are at `/home/aboba/workspace/projects/server/docs/`:
- `module/guide.md` - Module development guide.
- `module/rules.md` - Rules engine reference.
- `module/library.md` - Framework library functions.

## Source of Truth
- If `rules.txt` or `gdl-rules.txt` appear in the repo,
  treat them as the source of truth and regenerate `rules.js`.
- If the source files are absent, edit `rules.js` directly.
- For GDL language details see `tools/LANGUAGE.md`.

## Code Style (General)
- Prefer small, focused changes and follow the local file style.
- Most UI files use 4-space indentation; `tools/` scripts use tabs.
- Do not introduce new build steps or dependencies unless requested.
- Keep generated assets and large binary files out of code changes.
- Avoid adding inline comments unless explicitly requested.

## Code Style (Browser JavaScript)
- Files are plain scripts, not modules or bundler targets.
- Globals like `G`, `view`, and `data` are provided by the framework.
- Use `const` for values that never change and `let` for locals.
- Keep `var` usage consistent with surrounding code when editing.
- Prefer function declarations for shared helpers.
- Arrow functions are common for callbacks and event handlers.
- Avoid importing new libraries; use vanilla DOM APIs.
- Keep UI updates idempotent and safe to call repeatedly.
- Use `document.getElementById` and cached references consistently.

## Code Style (Server JavaScript)
- `rules.js` is executed in Node.js with CommonJS exports.
- Use `require` rather than ESM imports in server files.
- The rules engine is stateful; avoid hidden side effects.
- Treat `G` as the single source of game state.
- Preserve `exports.setup`, `exports.view`, and `exports.action` APIs.

## Formatting Guidelines
- Match existing semicolon usage within each file.
- Keep line lengths reasonable but do not reflow unrelated code.
- Use blank lines to separate logical sections.
- Align object literals and arrays in a compact, readable style.
- Keep trailing whitespace out of edited lines.

## Naming Conventions
- Constants use `UPPER_SNAKE_CASE` for gameplay constants.
- Regular variables use `lowerCamelCase`.
- DOM-related values often use `SNAKE_CASE` for globals like `CANVAS`.
- Functions use `verb_noun` or `verbNoun` based on local style.
- Keep exported identifiers consistent with current API names.

## Error Handling
- Browser code should guard against missing elements or data.
- Use `throw new Error` for invariant violations.
- Avoid swallowing errors silently; log to console if needed.
- In `tools/compile.js`, prefer raising `CompileError` for user input issues.
- Do not change error text format unless required by callers.

## Data and Assets
- `data.js` stores arrays of cards, pieces, and map definitions.
- Keep IDs and indices stable; update related references together.
- When adding assets, match existing naming patterns and folders.
- Do not remove assets unless explicitly requested.

## GDL and Rules Authoring
- The macro language is documented in `tools/LANGUAGE.md`.
- Globals are declared with the `global` directive.
- Procedural logic lives in `proc` blocks.
- `wait` blocks must avoid game state mutations in prompt mode.
- `action` blocks should only mutate state for matching actions.
- Use `view` blocks for view-only properties.
- Avoid using reserved globals `P`, `Aa`, `Ag`, and `V_inactive`.

## UI and Layout Conventions
- `layout.js` defines layout primitives and helpers.
- `world.js` manages DOM registry and interactions.
- `play.js` is the main gameplay UI glue.
- Keep `on_init` and `on_update` fast; they run frequently.
- Avoid expensive DOM queries inside tight loops.
- Use existing helper functions for layout and stacking.

## HTML and CSS
- HTML files are static and reference JS or CSS by relative paths.
- CSS uses global classes; avoid adding scoped tooling.
- Keep class names consistent with existing assets and layout helpers.
- Avoid introducing new CSS resets or frameworks.

## Documentation Expectations
- Update `README.txt` only if user-facing instructions change.
- Document new manual steps in this file if added.
- Avoid creating new docs unless requested.

## Cursor/Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `copilot-instructions.md` files found.
- If these appear later, follow them and update this file.

## Suggested Manual Checks
- Open `play.html` in a browser and load a sample game state.
- Verify key UI actions still trigger expected updates.
- If server changes are made, reload the Rally-the-Troops server.

## Notes for Agents
- Use `Read` before editing files and `Edit` for changes.
- Keep changes minimal and aligned with existing patterns.
- Do not run destructive git commands unless requested.
- Do not add tests unless explicitly asked.
- Ask before running `make` if it will generate files.

## Change Log
- Last updated: 2026-01-10.
- Added AI reference docs in `agent/docs/`.
- Update when build or test info changes.
- Keep entries short and actionable.
- Avoid removing prior guidance without reason.
