const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function assertIncludes(file, contents, expected) {
  assert(contents.includes(expected), `${file} should include: ${expected}`);
}

function assertNotIncludes(file, contents, unexpected) {
  assert(!contents.includes(unexpected), `${file} should not include: ${unexpected}`);
}

function validateAction(relativePath, expected) {
  const contents = read(relativePath);

  assertIncludes(relativePath, contents, 'using: "composite"');

  for (const input of expected.inputs || []) {
    assertIncludes(relativePath, contents, `${input}:`);
  }

  for (const step of expected.steps || []) {
    assertIncludes(relativePath, contents, step);
  }
}

function validateJsActions() {
  validateAction("js/actions/setup/action.yml", {
    inputs: ["node-version", "pkg-manager"],
    steps: ["actions/setup-node@v4", "corepack enable"],
  });

  validateAction("js/actions/install-deps/action.yml", {
    inputs: ["pkg-manager", "working-dir"],
    steps: ["npm ci", "yarn install", "pnpm install"],
  });

  validateAction("js/actions/test/action.yml", {
    inputs: ["pkg-manager", "working-dir"],
    steps: ["npm test", "yarn test", "pnpm test"],
  });

  validateAction("js/actions/auto-upgrade/action.yml", {
    inputs: ["pkg-manager", "working-dir", "upgrade-type"],
    steps: [
      "npx npm-check-updates -u",
      "--target",
    ],
  });

  const autoUpgrade = read("js/actions/auto-upgrade/action.yml");
  assertNotIncludes("js/actions/auto-upgrade/action.yml", autoUpgrade, "run: npm install");
  assertNotIncludes("js/actions/auto-upgrade/action.yml", autoUpgrade, "run: yarn install");
  assertNotIncludes("js/actions/auto-upgrade/action.yml", autoUpgrade, "run: pnpm install");

  validateAction("js/actions/vuln-check/action.yml", {
    inputs: ["pkg-manager", "working-dir", "audit-level"],
    steps: ["npm audit", "yarn audit", "pnpm audit"],
  });

  validateAction("js/actions/vuln-fix/action.yml", {
    inputs: ["pkg-manager", "working-dir", "force"],
    steps: ["npm audit fix", "npm audit fix --force"],
  });
}

function validateCommonActions() {
  validateAction("common/actions/checkout/action.yml", {
    inputs: ["repository", "ref", "path", "fetch-depth"],
    steps: ["actions/checkout@v4"],
  });

  validateAction("common/actions/artifact-upload/action.yml", {
    inputs: ["name", "path", "retention-days", "if-no-files-found"],
    steps: ["actions/upload-artifact@v4"],
  });

  validateAction("common/actions/create-pr/action.yml", {
    inputs: ["branch", "title", "body", "commit-message", "labels", "delete-branch"],
    steps: ["peter-evans/create-pull-request@v7"],
  });
}

function validateSharedComponentCheckoutWorkflow(file, actionPaths) {
  const contents = read(file);

  assertIncludes(file, contents, "workflow_call:");
  assertIncludes(file, contents, "components-ref:");
  assertIncludes(file, contents, "repository: DanielCononie/github-shared-components");
  assertIncludes(file, contents, "path: .github/shared-components");
  assertIncludes(file, contents, "ref: ${{ inputs.components-ref }}");

  for (const actionPath of actionPaths) {
    assertIncludes(file, contents, `uses: ./.github/shared-components/${actionPath}`);
    assertNotIncludes(file, contents, `uses: ./${actionPath}`);
  }
}

function validateReusableWorkflows() {
  validateSharedComponentCheckoutWorkflow(".github/workflows/js-ci.yml", [
    "js/actions/setup",
    "js/actions/install-deps",
    "js/actions/test",
  ]);

  validateSharedComponentCheckoutWorkflow(".github/workflows/js-security.yml", [
    "js/actions/setup",
    "js/actions/install-deps",
    "js/actions/vuln-check",
  ]);

  validateSharedComponentCheckoutWorkflow(".github/workflows/js-auto-upgrade.yml", [
    "js/actions/setup",
    "js/actions/auto-upgrade",
    "js/actions/install-deps",
    "js/actions/test",
  ]);

  const file = ".github/workflows/js-auto-upgrade.yml";
  const contents = read(file);

  assertIncludes(file, contents, "rm -rf .github/shared-components");
}

function validateWorkflowTemplates() {
  const starter = read("js/workflows/starter.yml");
  assertIncludes("js/workflows/starter.yml", starter, ".github/workflows/js-ci.yml@v1");

  const security = read("js/workflows/security.yml");
  assertIncludes("js/workflows/security.yml", security, ".github/workflows/js-security.yml@v1");
}

function validateFixtures() {
  for (const manager of ["npm", "yarn", "pnpm"]) {
    const fixtureDir = `fixtures/js-${manager}`;
    const packagePath = `${fixtureDir}/package.json`;

    assert(exists(packagePath), `${packagePath} should exist`);

    const pkg = JSON.parse(read(packagePath));

    assert(pkg.scripts && pkg.scripts.test, `${packagePath} should define scripts.test`);

    if (manager === "npm") {
      assert(exists(`${fixtureDir}/package-lock.json`), `${fixtureDir} should include package-lock.json`);
    }

    if (manager === "yarn") {
      assert(exists(`${fixtureDir}/yarn.lock`), `${fixtureDir} should include yarn.lock`);
    }

    if (manager === "pnpm") {
      assert(exists(`${fixtureDir}/pnpm-lock.yaml`), `${fixtureDir} should include pnpm-lock.yaml`);
    }
  }
}

validateJsActions();
validateCommonActions();
validateReusableWorkflows();
validateWorkflowTemplates();
validateFixtures();

if (failures.length > 0) {
  console.error("Validation failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Action component validation passed.");
