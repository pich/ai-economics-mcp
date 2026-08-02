# ai-economics-mcp

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21760145.svg)](https://doi.org/10.5281/zenodo.21760145)

[![npm](https://img.shields.io/npm/v/%40michalpiszczek%2Fai-economics-mcp?label=npm)](https://www.npmjs.com/package/@michalpiszczek/ai-economics-mcp) [![Glama score](https://glama.ai/mcp/servers/pich/ai-economics-mcp/badges/score.svg)](https://glama.ai/mcp/servers/pich/ai-economics-mcp) [![MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**MCP server for AI economics.** Gives Claude, Cursor and any MCP client 12 calculators for
the questions that decide AI budgets: what tokens cost, what queries burn, and whether agent
work can be proven.

Listed in the official [MCP Registry](https://registry.modelcontextprotocol.io) as **`pl.piszczek/ai-economics`** (domain-verified). Wraps the free [piszczek.pl/tools](https://piszczek.pl/tools) API — no key, no sign-up,
stateless (inputs are never stored). The math is the same as the interactive calculators.

## Install

**Claude Desktop / Claude Code** (`claude_desktop_config.json` / `.mcp.json`):

```json
{
  "mcpServers": {
    "ai-economics": {
      "command": "npx",
      "args": ["-y", "@michalpiszczek/ai-economics-mcp"]
    }
  }
}
```

**Claude Code one-liner:**

```bash
claude mcp add ai-economics -- npx -y @michalpiszczek/ai-economics-mcp
```

## Tools

| Tool | Answers |
|---|---|
| `token_cost` | What do 1M tokens cost per month across GPT, Claude, Gemini, DeepSeek? |
| `context_window` | How many tokens is 50 pages, does it fit, what does carrying it cost? |
| `agent_hour` | What does one hour of an AI agent cost, fully loaded with verification? |
| `model_routing` | How much does routing to a cheaper tier save per year? |
| `llm_energy` | How much electricity does an AI query use? |
| `joules_per_verified_task` | Which model is most efficient per task that actually passes? |
| `token_burn` | What does org-wide token burn cost in money, kWh, CO₂? |
| `humanoid_energy` | How long can a humanoid robot run per charge? |
| `proof_adjusted_autonomy` | How autonomous is a "90% autonomous" agent once proof is required? |
| `revocation_exposure` | How long does a revoked token keep working across your stack? |
| `verification_bottleneck` | How many AI agents can a human review team absorb? |
| `proof_debt` | What does unverified AI work cost over time? |

All parameters are optional; defaults mirror the interactive calculators. Every response
includes `result`, `formula`, `interpretation` and a ready-to-quote `cite_as` sentence.

## Example

> **You:** how autonomous is our agent really? it completes 90% alone, evidence for 95%,
> 80% independently validated, 90% on time
>
> **Claude** (calls `proof_adjusted_autonomy`): PAA = 61.6% — supervised autonomy. The gap
> vs the claimed 90% is 28.4 pp, and the biggest lever is independent validation…

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `AI_ECONOMICS_API` | `https://piszczek.pl/tools/api` | Point at a self-hosted instance |

## Concepts behind the tools

- [Joule Wars](https://piszczek.pl/joule-wars) — the AI race for energy efficiency
- [Proof-Adjusted Autonomy](https://piszczek.pl/proof-adjusted-autonomy) — the metric of proven agent work
- [Revocation Exposure](https://piszczek.pl/glossary/revocation-exposure) — how long revoked authority keeps working

## License

MIT. Concepts and calculators by [Michał Piszczek](https://piszczek.pl/michal-piszczek)
(CC BY 4.0 — attribution appreciated).
