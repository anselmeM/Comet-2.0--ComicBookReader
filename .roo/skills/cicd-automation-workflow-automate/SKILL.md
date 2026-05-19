---
name: cicd-automation-workflow-automate
description: "Workflow automation expert specializing in creating efficient CI/CD pipelines, GitHub Actions workflows, and automated development processes. Designs and implements automation that reduces manual work, improves consistency, and accelerates delivery while maintaining quality and security. Use for: CI/CD pipeline creation, GitHub Actions workflows, build automation, test automation, deployment automation, release management. Do NOT use for: one-off commands, unrelated tasks, or UI design."
---

# Workflow Automation

Design and implement efficient CI/CD pipelines, GitHub Actions workflows, and automated development processes.

## When to Use

- Automating CI/CD workflows or release pipelines
- Designing GitHub Actions or multi-stage build/test/deploy flows
- Replacing manual build, test, or deployment steps
- Improving pipeline reliability, visibility, or compliance checks

## When NOT to Use

- One-off commands or quick troubleshooting without automation context
- Tasks strictly focused on product or UI design
- Non-development operational tasks

## Safety Guidelines

- **Never run deployment steps without approvals and rollback plans**
- Treat secrets and environment configuration changes as high risk
- Require manual gates for production changes

## Inputs Required

- `$ARGUMENTS` - Current workflow context, target environments, or specific automation goals

## Workflow

### 1. Inventory Current State

Document existing:
- Build, test, and deploy steps
- Target environments (dev, staging, production)
- Current manual processes
- Existing CI/CD tools and integrations

### 2. Define Pipeline Architecture

Design stages with:

| Stage | Purpose | Artifacts |
|-------|---------|-----------|
| **Build** | Compile, bundle dependencies | Binary/artifact |
| **Test** | Unit, integration, e2e tests | Test reports |
| **Security** | Scan for vulnerabilities, secrets | Security report |
| **Deploy** | Staged rollout to environments | Deployed artifact |
| **Verify** | Smoke tests, health checks | Pass/fail status |

### 3. Implementation

Create workflow files:

```yaml
# .github/workflows/pipeline.yml structure
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      
  test:
    needs: build
    steps:
      - run: npm test
      - run: npm run lint
      
  security:
    needs: test
    steps:
      - run: npm audit
      - uses: secret-scanning scan
      
  deploy-staging:
    needs: security
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
  deploy-production:
    needs: security
    if: github.ref == 'refs/heads/main'
    environment: production
    with:
      approval_required: true
```

### 4. Quality Gates

Add automated checks:

```yaml
quality_gates:
  - name: Test coverage
    threshold: 80%
    action: fail
    
  - name: Security scan
    severity: high
    action: fail
    
  - name: Secret detection
    action: fail
    
  - name: Performance budget
    threshold: 10% regression
    action: warn
```

### 5. Secrets & Configuration

Document required:

```yaml
required_secrets:
  - DATABASE_URL
  - API_KEYS
  - DEPLOYMENT_CREDENTIALS
  
required_env_vars:
  - NODE_ENV
  - NEXT_PUBLIC_API_URL
  
service_integrations:
  - cloud_providers: [aws, gcp, vercel]
  - monitoring: [datadog, sentry]
  - notifications: [slack, teams]
```

### 6. Rollback Strategy

Define for each environment:

```
rollback_procedure:
  trigger: "Manual or automated on deployment failure"
  steps:
    1. Identify last known good commit
    2. Re-run deploy job with specific ref
    3. Verify health checks pass
    4. Notify team via configured channel
    
notifications:
  on_success: "#deployments channel"
  on_failure: "#alerts channel + on-call"
```

## Output Format

Deliver:

1. **Pipeline Summary** - Stages, triggers, and execution flow
2. **Workflow Files** - Ready-to-use YAML in `.github/workflows/`
3. **Secrets Inventory** - Required secrets and secure handling approach
4. **Risks & Assumptions** - Known limitations and dependencies
5. **Rollback Playbook** - Step-by-step recovery procedure

## Resources

See `resources/implementation-playbook.md` for detailed workflow patterns, caching strategies, and advanced deployment scenarios.