# Risk Register

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R-01 | Env misconfiguration in prod | High | Medium | Validate envs, `.env.example`, deploy checklists |
| R-02 | DB schema drift | Medium | Medium | Disable `synchronize` in prod, use migrations |
| R-03 | API health degraded under load | High | Medium | Add rate limiting, caching, scale horizontally |
| R-04 | Third-party API instability | Medium | Medium | Retries/backoff (Axios), circuit breakers |
| R-05 | Security misconfig in CI/CD | High | Low | Least-privilege tokens, secret scanning |
| R-06 | Incomplete testing coverage | Medium | Medium | Enforce tests for core modules, smoke checks |
| R-07 | Operational monitoring gaps | High | Medium | Health polling, plan Prometheus/Grafana |

Notes:
- Track risks in issues with owners and target dates.
- Review weekly and update mitigations.