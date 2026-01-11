"use strict"

const fs = require("node:fs")
const path = require("node:path")

const harness = require("./harness")

function listTestFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listTestFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(fullPath)
    }
  }

  return files
}

function uniqueFiles(files) {
  const seen = new Set()
  return files.filter((file) => {
    const resolved = path.resolve(file)
    if (seen.has(resolved)) {
      return false
    }
    seen.add(resolved)
    return true
  })
}

function resolveFilesFromArgs(args) {
  const fileArgs = args.filter((arg) => !arg.startsWith("--"))
  if (fileArgs.length === 0) {
    return null
  }

  return fileArgs.map((file) => path.resolve(process.cwd(), file))
}

function getDefaultFiles() {
  const smoke = path.join(process.cwd(), "test", "smoke.test.js")
  const specsDir = path.join(process.cwd(), "test", "specs")
  const specs = listTestFiles(specsDir)
  return [smoke, ...specs]
}

function buildFileList(args) {
  const explicitFiles = resolveFilesFromArgs(args)
  if (explicitFiles) {
    return explicitFiles
  }

  const flags = new Set(args.filter((arg) => arg.startsWith("--")))
  const smoke = path.join(process.cwd(), "test", "smoke.test.js")
  const fuzz = path.join(process.cwd(), "test", "fuzz.test.js")
  const specsDir = path.join(process.cwd(), "test", "specs")
  const specs = listTestFiles(specsDir)

  if (flags.has("--all")) {
    return [smoke, ...specs, fuzz]
  }

  if (flags.has("--smoke") && flags.has("--fuzz")) {
    return [smoke, fuzz]
  }

  if (flags.has("--smoke")) {
    return [smoke]
  }

  if (flags.has("--fuzz")) {
    return [fuzz]
  }

  return getDefaultFiles()
}

function runTestFile(filePath) {
  const relative = path.relative(process.cwd(), filePath)
  console.log(`\nRunning ${relative}...`)

  let tests
  try {
    tests = require(filePath)
  } catch (error) {
    console.log(`  [FAIL] Failed to load ${relative}`)
    console.log(`    Error: ${error.message}`)
    return { total: 1, passed: 0, failed: 1 }
  }

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      test.test(harness)
      console.log(`  [PASS] ${test.name}`)
      passed++
    } catch (error) {
      console.log(`  [FAIL] ${test.name}`)
      console.log(`    Error: ${error.message}`)
      if (error.stack) {
        const stackLines = error.stack.split("\n").slice(1)
        for (const line of stackLines) {
          console.log(`    ${line.trim()}`)
        }
      }
      failed++
    }
  }

  return { total: passed + failed, passed, failed }
}

function main() {
  const args = process.argv.slice(2)
  const files = uniqueFiles(buildFileList(args)).filter((file) => fs.existsSync(file))

  console.log("=== Empire of the Sun Test Runner ===")

  let total = 0
  let passed = 0
  let failed = 0

  for (const file of files) {
    const result = runTestFile(file)
    total += result.total
    passed += result.passed
    failed += result.failed
  }

  console.log("\n=== Results ===")
  console.log(`Total:  ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main()
