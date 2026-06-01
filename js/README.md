# Reusable JavaScript GitHub Action Components

These components are the active implementation path for this repository.

## Composite Actions

Use individual actions when a consuming repository owns the workflow shape:

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: DanielCononie/github-shared-components/js/actions/setup@v1
    with:
      node-version: "22"

  - uses: DanielCononie/github-shared-components/js/actions/install-deps@v1
    with:
      pkg-manager: npm

  - uses: DanielCononie/github-shared-components/js/actions/test@v1
    with:
      pkg-manager: npm
```

Available actions:

- `setup`: install Node.js with `actions/setup-node`.
- `install-deps`: install dependencies with `npm`, `yarn`, or `pnpm`.
- `test`: run tests with `npm`, `yarn`, or `pnpm`.
- `auto-upgrade`: upgrade dependencies with `npm-check-updates`.
- `vuln-check`: audit dependencies with `npm`, `yarn`, or `pnpm`.
- `vuln-fix`: run `npm audit fix`; yarn and pnpm fail with a clear unsupported message.

## CI Workflow

Use the JavaScript CI workflow when a consuming repository wants this library to own setup, dependency installation, and tests:

```yaml
jobs:
  ci:
    uses: DanielCononie/github-shared-components/.github/workflows/js-ci.yml@v1
    with:
      node-version: "22"
      pkg-manager: npm
      working-dir: "."
      components-ref: v1
```

## Security Workflow

Use the JavaScript security workflow for dependency auditing:

```yaml
jobs:
  security:
    uses: DanielCononie/github-shared-components/.github/workflows/js-security.yml@v1
    with:
      node-version: "22"
      pkg-manager: npm
      working-dir: "."
      audit-level: high
      components-ref: v1
```

## Auto-Upgrade Workflow

Use the JavaScript auto-upgrade workflow when a consuming repository wants this library to own the full dependency-upgrade job:

```yaml
jobs:
  upgrade:
    uses: DanielCononie/github-shared-components/.github/workflows/js-auto-upgrade.yml@v1
    with:
      node-version: "22"
      pkg-manager: npm
      working-dir: "."
      upgrade-type: patch
      components-ref: v1
```

The reusable workflow checks out the caller repository first, then checks out this components repository into `.github/shared-components` before using local composite actions.
