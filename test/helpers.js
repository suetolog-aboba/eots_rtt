"use strict"

const harness = require("./harness")

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed")
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message ||
        `Objects not equal:\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(actual)}`
    )
  }
}

function assertThrows(fn, message) {
  let threw = false
  try {
    fn()
  } catch (e) {
    threw = true
  }
  if (!threw) {
    throw new Error(message || "Expected function to throw")
  }
}

function setupGame(scenario = "1942", options = {}) {
  const rules = require("../rules")
  return harness.setup(rules, scenario, options)
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function playUntil(game, conditionFn, maxSteps = 100) {
  for (let i = 0; i < maxSteps; i++) {
    if (conditionFn(game)) return true
    if (game.state.result) return false

    const active = game.state.active
    if (!active || active === "None") return false

    const view = harness.view(game, active)
    const actions = harness.listActions(view)
    if (actions.length === 0) return false

    const action = randomChoice(actions)
    harness.action(game, action.role, action.verb, action.arg)
  }
  return false
}

module.exports = {
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
  setupGame,
  randomChoice,
  playUntil,
  harness,
}
