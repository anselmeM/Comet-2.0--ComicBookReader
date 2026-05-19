---
name: codebase-cleanup-tech-debt
description: "Technical debt expert specializing in identifying, quantifying, and prioritizing technical debt in software projects. Analyzes codebase to uncover debt, assesses impact, and creates actionable remediation plans. Use for: technical debt analysis, code quality assessment, refactoring planning, debt inventory creation, impact calculation, ROI projections, remediation roadmaps. Do NOT use for: unrelated tasks or different domains."
---

# Technical Debt Analysis and Remediation

Analyze the codebase to identify, quantify, and prioritize technical debt. Create actionable remediation plans with clear ROI.

## When to Use

- Technical debt analysis and prioritization
- Code quality assessment and improvement planning
- Refactoring roadmaps with ROI calculations
- Debt inventory creation and tracking
- Sprint planning for debt reduction

## When NOT to Use

- Tasks unrelated to technical debt or code quality
- Writing new feature code
- Debugging specific bugs (use Debug mode)

## Inputs Required

- `$ARGUMENTS` - Project context or specific focus area

## Workflow

### 1. Debt Discovery

Scan for debt across four categories:

| Category | Focus Areas |
|----------|-------------|
| **Code Debt** | Duplication, complexity (>10 cyclomatic), long methods (>50 lines), god classes |
| **Architecture Debt** | Circular dependencies, violated boundaries, outdated tech stack |
| **Testing Debt** | Coverage gaps, brittle tests, missing integration tests |
| **Infrastructure Debt** | Manual deployments, missing monitoring, no rollback procedures |

### 2. Impact Quantification

For each debt item, calculate:

```
Monthly Cost = frequency × (investigation + fix + test + deploy) × hourly_rate
Annual Cost = Monthly Cost × 12
```

Risk levels: **Critical** (security) > **High** (performance) > **Medium** (velocity) > **Low** (style)

### 3. Prioritization

| Priority | Criteria | Timeline |
|----------|----------|----------|
| **Quick Wins** | High value, low effort (<1 sprint) | Week 1-2 |
| **Medium-Term** | Significant improvement, 1-3 months | Month 1-3 |
| **Long-Term** | Architecture changes | Quarter 2-4 |

### 4. Output Format

Deliver:

1. **Debt Inventory** - Categorized list with metrics
2. **Impact Analysis** - Cost calculations per item
3. **Prioritized Roadmap** - Quarter-by-quarter plan
4. **Quick Wins** - Immediate sprint actions
5. **Implementation Guide** - Step-by-step refactoring strategies
6. **Prevention Plan** - Quality gates to avoid new debt
7. **ROI Projections** - Expected returns on investment

## Quality Gates

Recommend automated checks:

```yaml
pre_commit:
  complexity_max: 10
  duplication_max: 5%
  coverage_min: 80% (new code)

ci_pipeline:
  dependency_audit: no high vulnerabilities
  performance_test: no regression >10%
  architecture_check: no new violations
```

## Success Metrics

Track with measurable KPIs:

- Debt score reduction: Target -5% monthly
- New bug rate: Target -20%
- Deployment frequency: Target +50%
- Test coverage improvement: +10% per quarter

## References

For detailed methodologies, see:
- `references/DEBT_CATEGORIES.md` - Complete debt type taxonomy
- `references/IMPACT_CALCULATION.md` - Cost modeling formulas
- `references/REFACTORING_PATTERNS.md` - Safe refactoring strategies