# Testing Guide for Empire of the Sun

## Overview

This guide explains how to write and run tests for Empire of the Sun features. The test infrastructure allows you to:

1. Verify existing functionality doesn't break (smoke tests)
2. Test specific features against acceptance criteria (feature tests)
3. Find edge-case crashes (fuzz tests)

## Running Tests

### Using Docker (Recommended)

Build the test image (first time only):

```bash
docker build -t eots-test .
```

Run all tests (smoke + feature specs):

```bash
docker run --rm -v $(pwd):/app eots-test npm test
```

Run only smoke tests (fast):

```bash
docker run --rm -v $(pwd):/app eots-test npm run test:smoke
```

Run fuzz tests (slow, thorough):

```bash
docker run --rm -v $(pwd):/app eots-test npm run test:fuzz
```

Run everything:

```bash
docker run --rm -v $(pwd):/app eots-test npm run test:all
```

### Interpreting Results

```
=== Empire of the Sun Test Runner ===

Running smoke.test.js...
  [PASS] Game setup doesn't crash
  [FAIL] Can execute first available action
    Error: Action threw an error: undefined is not a function
    at test/smoke.test.js:32:7

=== Results ===
Total:  6
Passed: 5
Failed: 1
```

- `[PASS]` - Test succeeded
- `[FAIL]` - Test failed, see error message below

## Writing Tests

### File Location and Naming

- Smoke tests: `test/smoke.test.js` (already exists)
- Fuzz tests: `test/fuzz.test.js` (already exists)
- Feature tests: `test/specs/<feature-name>.test.js`

### Test File Structure

```javascript
const { assert, assertEqual, setupGame } = require('../helpers')
const harness = require('../harness')

module.exports = [
  {
    name: "Descriptive name of what is being tested",
    test: function() {
      // 1. Setup
      const game = setupGame("1942")
      
      // 2. Execute actions to reach the state you want to test
      // ... 
      
      // 3. Verify expectations
      assert(someCondition, "Message if condition is false")
      assertEqual(actualValue, expectedValue, "Message if not equal")
    }
  },
  // More tests...
]
```

### Available Helpers

From `test/helpers.js`:

```javascript
// Assertions
assert(condition, message)           // Fail if condition is false
assertEqual(actual, expected, msg)   // Fail if not equal
assertDeepEqual(actual, expected)    // Deep comparison for objects/arrays
assertThrows(fn, message)            // Fail if fn doesn't throw

// Game utilities
setupGame(scenario, options)         // Create a new game
randomChoice(array)                  // Pick random element
playUntil(game, conditionFn, max)    // Play randomly until condition met
```

From `test/harness.js`:

```javascript
harness.setup(rules, scenario, options)  // Low-level setup
harness.view(game, role)                 // Get player's view
harness.action(game, role, verb, arg)    // Execute an action
harness.listActions(view)                // List all valid actions
```

## Writing Tests from Acceptance Criteria

### Example: Feature Specification

From `agent/docs/features.md`:

```
## Feature: HQ Units Never Delayed (Section 9.23)

Acceptance Criteria:
- HQ units are never placed in the Delayed Reinforcement box
- HQ units must be placed immediately when scheduled
- This applies regardless of WIE level
```

### Corresponding Test

```javascript
// test/specs/reinforcement.test.js

const { assert, setupGame } = require('../helpers')
const harness = require('../harness')
const data = require('../../data')

// Find HQ unit IDs
const SEAC_HQ = data.pieces.findIndex(p => p.id === "hq_ap_seac")

module.exports = [
  {
    name: "HQ units are never delayed regardless of WIE level",
    test: function() {
      const game = setupGame("1942")
      
      // Set WIE to a level that normally causes delays
      game.state.wie = 3
      
      // Advance to reinforcement phase
      // (You may need to play actions to get here, or directly manipulate state for unit testing)
      
      // Get Allied view during reinforcement
      const view = harness.view(game, "Allies")
      
      // If HQ is scheduled this turn, it should be in placeable actions, not delayed
      if (view.actions && view.actions.place) {
        // HQ should be placeable if it's a reinforcement
        // Check that it's NOT in the delayed box
        assert(
          !game.state.delayed || !game.state.delayed.includes(SEAC_HQ),
          "HQ unit should never be in delayed reinforcement box"
        )
      }
    }
  }
]
```

## Test Development Workflow

### For New Features

1. **Read** the acceptance criteria in `agent/docs/features.md`
2. **Create** a new test file: `test/specs/<feature>.test.js`
3. **Write** tests for each criterion (they should FAIL initially)
4. **Implement** the feature in `rules.js`
5. **Run tests** and iterate until all pass
6. **Run smoke tests** to ensure nothing broke
7. **Run fuzzer** to catch edge cases

### Commands for Iteration

```bash
# Quick feedback loop (smoke + your new tests)
docker run --rm -v $(pwd):/app eots-test npm test

# Just run smoke tests after changes
docker run --rm -v $(pwd):/app eots-test npm run test:smoke

# Full verification before committing
docker run --rm -v $(pwd):/app eots-test npm run test:all
```

## Debugging Tips

### Print Game State

```javascript
test: function() {
  const game = setupGame("1942")
  
  // Print full state
  console.log("STATE:", JSON.stringify(game.state, null, 2))
  
  // Print specific parts
  console.log("Active player:", game.state.active)
  console.log("Current phase:", game.state.state)
}
```

### Print Available Actions

```javascript
const view = harness.view(game, "Japan")
const actions = harness.listActions(view)
console.log("Actions:", actions)
console.log("Prompt:", view.prompt)
```

### Isolate a Failing Test

Run a specific test file:

```bash
docker run --rm -v $(pwd):/app eots-test node test/runner.js test/specs/movement.test.js
```

## Common Patterns

### Testing That an Action is Invalid

```javascript
{
  name: "Ground units cannot enter ocean hexes",
  test: function() {
    const game = setupGame("1942")
    // ... setup to have a ground unit ready to move
    
    const view = harness.view(game, "Japan")
    const actions = harness.listActions(view)
    
    // Find move actions and check that ocean hexes are not valid targets
    const moveActions = actions.filter(a => a.verb === "move")
    const oceanHexes = [/* list of ocean hex IDs */]
    
    for (const action of moveActions) {
      assert(
        !oceanHexes.includes(action.arg),
        `Ground unit should not be able to move to ocean hex ${action.arg}`
      )
    }
  }
}
```

### Testing State Changes After an Action

```javascript
{
  name: "Playing a card reduces hand size",
  test: function() {
    const game = setupGame("1942")
    const handBefore = game.state.hands[0].length // Japan's hand
    
    // Play a card action
    harness.action(game, "Japan", "play_card", game.state.hands[0][0])
    
    const handAfter = game.state.hands[0].length
    assertEqual(handAfter, handBefore - 1, "Hand size should decrease by 1")
  }
}
```
