# CI/CD Workflow Automation - Comet 2.0

> Workflow automation expert specializing in efficient CI/CD pipelines, GitHub Actions, and automated development processes.

---

## Executive Summary

This document defines the CI/CD pipeline for Comet 2.0 Comic Book Reader. Currently, the project lacks automated testing, type checking, and CI/CD workflows. This guide provides a complete automation strategy.

| Component        | Current State | Target State | Gap      |
| ---------------- | ------------- | ------------ | -------- |
| Linting          | Manual        | Automated    | -        |
| Type Checking    | Manual        | Automated    | -        |
| Testing          | None          | Automated    | Critical |
| Dependency Audit | None          | Automated    | High     |
| Build            | Manual        | Automated    | Medium   |
| Deploy           | Manual        | Automated    | High     |

---

## 1. Pipeline Overview

### 1.1 Triggers

| Event             | Workflow    | Description                       |
| ----------------- | ----------- | --------------------------------- |
| Push to `main`    | CI + Deploy | Full pipeline + production deploy |
| PR to `main`      | CI          | Build, test, scan                 |
| PR to `feature/*` | CI          | Build + lint                      |
| Tag release       | Release     | Build + publish                   |
| Schedule (daily)  | Audit       | Dependency scan                   |

### 1.2 Pipeline Stages

```
┌──────────────┐
│  TRIGGER    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   SETUP     │ ← Checkout, cache, env
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   INSTALL   │ ← Dependencies (with cache)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   LINT     │ ← ESLint + Prettier
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   TYPES    │ ← TypeScript check
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   TEST      │ ← Unit + Integration
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   SCAN      │ ← Security (Snyk/npm audit)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   BUILD    │ ← Next.js build
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  DEPLOY    │ ← conditional
└──────────────┘
```

---

## 2. GitHub Actions Workflows

### 2.1 CI Pipeline (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Get npm cache dir
        id: npm-cache
        run: echo "dir=$(npm config get cache)" >> $GITHUB_OUTPUT

      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ${{ steps.npm-cache.outputs.dir }}
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

  lint:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npx prettier --check src/

  typecheck:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript
        run: npx tsc --noEmit

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test --if-present

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  security:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Run Snyk
        uses: snyk/ghaction@v3
        with:
          command: test
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    needs: [lint, typecheck, test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next/
          retention-days: 7
```

### 2.2 Deploy Pipeline (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '20'

jobs:
  deploy-staging:
    if: github.event_name == 'push' || github.event.inputs.environment == 'staging'
    needs: build
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: nextjs-build
          path: .next/

      - name: Deploy to staging
        run: |
          # Deploy commands for staging
          echo "Deploying to staging..."

  deploy-production:
    if: github.event.inputs.environment == 'production'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    needs_review: true

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: nextjs-build
          path: .next/

      - name: Deploy to production
        run: |
          # Deploy commands for production
          echo "Deploying to production..."
```

### 2.3 Dependency Audit (.github/workflows/audit.yml)

```yaml
name: Dependency Audit

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly Sunday
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit

      - name: Run Snyk monitor
        uses: snyk/ghaction@v3
        with:
          command: monitor
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  report:
    needs: audit
    runs-on: ubuntu-latest
    steps:
      - name: Create issue
        if: needs.audit.outputs.vulns-found == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '[Security] Dependency vulnerability detected',
              body: 'Weekly audit found vulnerabilities. Action required.'
            })
```

---

## 3. Package.json Updates

### 3.1 Add Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "node scripts/prisma-provider-switch.js && npx prisma generate && npx prisma db push --accept-data-loss && next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install",
    "pre-commit": "lint-staged"
  }
}
```

### 3.2 Add QA Dependencies

```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 4. Quality Gates

### 4.1 Gate Thresholds

| Gate       | Threshold    | Action |
| ---------- | ------------ | ------ |
| ESLint     | 0 errors     | Fail   |
| TypeScript | 0 errors     | Fail   |
| Tests      | 80% coverage | Warn   |
| Security   | 0 critical   | Fail   |
| Build      | Success      | Fail   |

### 4.2 Implementation

```yaml
# Quality gates in CI
- name: Fail on lint errors
  run: npm run lint || exit 1

- name: Fail on type errors
  run: npm run typecheck || exit 1

- name: Fail on critical vulnerabilities
  run: npm audit --audit-level=critical || exit 1
```

---

## 5. Environment Configuration

### 5.1 Required Secrets

| Secret                  | Description           | Required For  |
| ----------------------- | --------------------- | ------------- |
| `DATABASE_URL`          | PostgreSQL connection | Build, Deploy |
| `NEXTAUTH_SECRET`       | Auth.js signing       | Build, Deploy |
| `NEXTAUTH_URL`          | Production URL        | Deploy        |
| `SNYK_TOKEN`            | Snyk security         | Security Scan |
| `AWS_ACCESS_KEY_ID`     | S3 upload             | Deploy        |
| `AWS_SECRET_ACCESS_KEY` | S3 upload             | Deploy        |
| `REDIS_URL`             | Rate limiting         | Build, Deploy |

### 5.2 Environment Variables

| Variable              | Description | Default      |
| --------------------- | ----------- | ------------ |
| `NODE_ENV`            | Environment | `production` |
| `NEXT_PUBLIC_API_URL` | API URL     | -            |

---

## 6. Rollback Strategy

### 6.1 Automated Rollback

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        run: |
          echo "Rolling back to ${{ github.event.inputs.version }}"
          # Add rollback commands
```

### 6.2 Manual Process

1. Navigate to GitHub Actions
2. Select successful previous run
3. Click "Re-run all jobs"
4. Monitor deployment

---

## 7. Notification Strategy

### 7.1 Slack Integration

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 7.2 Notification Matrix

| Event    | Channel   | Message                |
| -------- | --------- | ---------------------- |
| Success  | #builds   | ✅ Build passed        |
| Failure  | #builds   | ❌ Build failed        |
| Deploy   | #releases | 🚀 Deployed v{version} |
| Security | #security | ⚠️ Vulnerability found |

---

## 8. Implementation Checklist

- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Create `.github/workflows/audit.yml`
- [ ] Add npm scripts to `package.json`
- [ ] Configure ESLint rules
- [ ] Configure Prettier
- [ ] Set up Vitest
- [ ] Add secrets to GitHub
- [ ] Configure environments
- [ ] Set up Slack notifications

---

## 9. Current vs Target Comparison

| Aspect     | Current (Manual) | Target (Automated) |
| ---------- | ---------------- | ------------------ |
| Lint       | `npm run lint`   | On every PR        |
| Type check | `npx tsc`        | On every PR        |
| Tests      | None             | On every PR        |
| Security   | None             | Weekly             |
| Build      | `npm run build`  | On merge           |
| Deploy     | Manual           | On main merge      |
| Rollback   | Manual           | Automated          |

---

## 10. Estimated Setup Time

| Task            | Effort       |
| --------------- | ------------ |
| CI workflow     | 4 hours      |
| Test setup      | 8 hours      |
| Deploy workflow | 8 hours      |
| Security scan   | 4 hours      |
| Notifications   | 2 hours      |
| **Total**       | **26 hours** |

---

> Safety: Always require approval for production deployments. Never deploy without rollback capability.
