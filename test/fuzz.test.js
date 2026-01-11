"use strict"

const { setupGame, randomChoice } = require("./helpers")
const harness = require("./harness")

const MAX_STEPS = 500

module.exports = [
  {
    name: `Fuzz test: ${MAX_STEPS} random actions without crash or dead-end`,
    test: function () {
      const game = setupGame("1942")

      for (let step = 0; step < MAX_STEPS; step++) {
        if (game.state.result) {
          return
        }

        const active = game.state.active
        if (!active || active === "None") {
          return
        }

        let role = active
        if (Array.isArray(active)) {
          role = randomChoice(active)
        } else if (active === "Both") {
          role = randomChoice(["Japan", "Allies"])
        }

        const view = harness.view(game, role)
        const actions = harness.listActions(view)

        if (actions.length === 0) {
          throw new Error(
            `Dead end at step ${step}: no actions available.\n` +
              `State: ${JSON.stringify(game.state.state || game.state.L?.P)}\n` +
              `Prompt: ${view.prompt}`
          )
        }

        const action = randomChoice(actions)

        try {
          harness.action(game, action.role, action.verb, action.arg)
        } catch (e) {
          throw new Error(
            `Crash at step ${step}\n` +
              `Action: ${action.role} ${action.verb} ${JSON.stringify(action.arg)}\n` +
              `State: ${JSON.stringify(game.state.state || game.state.L?.P)}\n` +
              `Original error: ${e.message}\n` +
              `Stack: ${e.stack}`
          )
        }
      }
    },
  },
]
