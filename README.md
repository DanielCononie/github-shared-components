# GitHub Actions Components

Reusable GitHub Actions components for common project workflows.

This repository is organized around two reuse surfaces:

- Composite actions for small, focused steps such as setting up Node.js, installing dependencies, and running tests.
- Reusable workflows for full jobs such as JavaScript dependency upgrades.

## Versioning

Consumers should pin actions and workflows to a stable tag, such as `v1`, a semantic version tag, or a commit SHA. Avoid using `main` for production workflows because changes in this repository can affect every consuming repository immediately.

Recommended tag pattern:

- `v1` for the latest compatible v1 release.
- `v1.0.0`, `v1.1.0`, and later semantic release tags for exact versions.
- Full commit SHA for maximum supply-chain stability.

## Use A Composite Action

Composite actions can be referenced directly from this repository:

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4

  - name: Setup Node.js
    uses: DanielCononie/github-shared-components/js/actions/setup@v1
    with:
      node-version: "22"

  - name: Install dependencies
    uses: DanielCononie/github-shared-components/js/actions/install-deps@v1
    with:
      pkg-manager: npm

  - name: Run tests
    uses: DanielCononie/github-shared-components/js/actions/test@v1
    with:
      pkg-manager: npm
```

Use this mode when the consumer repository wants to own the workflow shape while reusing shared building blocks.

## Use A Reusable Workflow

Reusable workflows can be called from another repository:

```yaml
name: Upgrade JavaScript Dependencies

on:
  workflow_dispatch:

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

Reusable workflows run in the caller's repository. When they need composite actions from this repository, they checkout this repository into `.github/shared-components` and call actions from that stable path.

## Project Status

JavaScript support is the active implementation path. Python, Go, and TypeScript starter kits are placeholders.

Implemented JavaScript components:

- `js/actions/setup`
- `js/actions/install-deps`
- `js/actions/test`
- `js/actions/auto-upgrade`
- `js/actions/vuln-check`
- `js/actions/vuln-fix`

Implemented common components:

- `common/actions/checkout`
- `common/actions/artifact-upload`
- `common/actions/create-pr`

Partially implemented or planned components:

- language starter kits under `python/`, `go/`, and `ts/`

Reusable JavaScript workflows:

- `.github/workflows/js-ci.yml`
- `.github/workflows/js-security.yml`
- `.github/workflows/js-auto-upgrade.yml`

## Development

Run validation locally:

```bash
npm test
```

The validation script checks reusable workflow contracts, confirms local composite action metadata is present, and verifies the JavaScript package-manager fixtures.



git tag v1
git push origin main
git push origin tag v1   