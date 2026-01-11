"use strict"

function listRoles(rules, scenario, options) {
  if (typeof rules.roles === "function") {
    return rules.roles(scenario, options)
  }
  return rules.roles
}

function normalizeRole(role, roles) {
  if (roles.includes(role)) {
    return role
  }
  if (role === "Allies" && roles.includes("Alies")) {
    return "Alies"
  }
  if (role === "Alies" && roles.includes("Allies")) {
    return "Allies"
  }
  return role
}

function generateSeed() {
  return Math.floor(Math.random() * 2147483647) + 1
}

exports.setup = function (rules, scenario, options) {
  const seed = generateSeed()
  const state = rules.setup(seed, scenario, options)
  const roles = listRoles(rules, scenario, options)
  return {
    seed,
    scenario,
    options,
    roles,
    state,
    rules,
  }
}

exports.view = function (game, role) {
  const normalizedRole = normalizeRole(role, game.roles)
  const view = game.rules.view(game.state, normalizedRole)
  view.role = normalizedRole
  return view
}

exports.action = function (game, role, verb, arg) {
  const normalizedRole = normalizeRole(role, game.roles)
  game.state = game.rules.action(game.state, normalizedRole, verb, arg)
  return game
}

exports.listActions = function (view) {
  const actions = []
  const role = view.role
  let undoAction = null

  if (!view.actions) {
    return actions
  }

  for (const verb of Object.keys(view.actions)) {
    const arg = view.actions[verb]

    if (verb === "undo") {
      if (arg === 1 || arg === true) {
        undoAction = { role, verb: "undo" }
      }
      continue
    }

    if (arg === 0 || arg === false) {
      continue
    }

    if (arg === 1 || arg === true) {
      actions.push({ role, verb })
      continue
    }

    if (Array.isArray(arg)) {
      for (const entry of arg) {
        if (typeof entry !== "number" && typeof entry !== "string") {
          throw new Error(`Invalid action argument: ${verb} ${entry}`)
        }
        actions.push({ role, verb, arg: entry })
      }
      continue
    }

    if (typeof arg === "string") {
      actions.push({ role, verb })
      continue
    }

    throw new Error(`Invalid action: ${verb} ${arg}`)
  }

  if (actions.length === 0 && undoAction) {
    actions.push(undoAction)
  }

  return actions
}
