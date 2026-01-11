"use strict"

const { assert, setupGame, randomChoice } = require("./helpers")
const harness = require("./harness")

module.exports = [
  {
    name: "Game setup doesn't crash",
    test: function () {
      const game = setupGame("1942")
      assert(game !== undefined, "Game is undefined")
      assert(game.state !== undefined, "Game state is undefined")
    },
  },

  {
    name: "Initial view is valid for Japan",
    test: function () {
      const game = setupGame("1942")
      const view = harness.view(game, "Japan")
      assert(view !== undefined, "View is undefined")
      assert(typeof view.prompt === "string", "Prompt should be a string")
    },
  },

  {
    name: "Initial view is valid for Allies",
    test: function () {
      const game = setupGame("1942")
      const view = harness.view(game, "Allies")
      assert(view !== undefined, "View is undefined")
      assert(typeof view.prompt === "string", "Prompt should be a string")
    },
  },

  {
    name: "Can list actions from initial view",
    test: function () {
      const game = setupGame("1942")
      const active = game.state.active
      assert(active, "No active player")

      const view = harness.view(game, active)
      const actions = harness.listActions(view)
      assert(Array.isArray(actions), "Actions should be an array")
      assert(actions.length > 0, "Should have at least one action")
    },
  },

  {
    name: "Can execute first available action",
    test: function () {
      const game = setupGame("1942")
      const active = game.state.active
      const view = harness.view(game, active)
      const actions = harness.listActions(view)

      assert(actions.length > 0, "No actions available")

      const action = actions[0]
      harness.action(game, action.role, action.verb, action.arg)
    },
  },

  {
    name: "Can play 50 random actions without crashing",
    test: function () {
      const game = setupGame("1942")

      for (let i = 0; i < 50; i++) {
        if (game.state.result) break

        const active = game.state.active
        if (!active || active === "None") break

        const view = harness.view(game, active)
        const actions = harness.listActions(view)

        if (actions.length === 0) break

        const action = randomChoice(actions)
        harness.action(game, action.role, action.verb, action.arg)
      }
    },
  },
]
