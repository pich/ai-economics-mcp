#!/usr/bin/env node
/**
 * ai-economics-mcp — MCP server exposing the AI Economics Tools API
 * (https://piszczek.pl/tools) as Model Context Protocol tools.
 *
 * Thin client by design: the math lives server-side (same formulas as the
 * interactive calculators), responses are stateless and inputs are never
 * stored. No API key. Concepts & calculators by Michał Piszczek.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.AI_ECONOMICS_API ?? "https://piszczek.pl/tools/api";

const num = (desc) => z.number().optional().describe(desc);
const point = (desc) =>
  z.string().optional().describe(desc + " — 'jwt' | 'intro' | 'poll:N' (seconds) | 'off'");

/** slug → { title, description, schema } — mirrors GET /tools/api discovery. */
const TOOLS = {
  "revocation-exposure": {
    title: "Revocation Exposure",
    description:
      "How long does a revoked token keep working across gateways, caches and workers? " +
      "Returns the worst-case exposure window, an A–F grade and the weakest enforcement point.",
    schema: {
      ttl: num("access-token TTL in seconds (default 3600)"),
      gw: point("API gateway enforcement (default 'intro')"),
      edge: point("edge/CDN enforcement (default 'jwt')"),
      mesh: point("service-mesh enforcement (default 'jwt')"),
      batch: point("batch/worker enforcement (default 'off')"),
      rate: num("requests/min of one credential (default 60)"),
    },
  },
  "proof-adjusted-autonomy": {
    title: "Proof-Adjusted Autonomy (PAA)",
    description:
      "How autonomous is an AI agent once proof is required? " +
      "PAA = P(A) × P(C|A) × P(R|A,C) × P(T|A,C,R). Returns the honest percentage, " +
      "the gap vs claimed autonomy and the single gate where +5pp pays most.",
    schema: {
      a: num("autonomous completion % (default 90)"),
      c: num("complete evidence % (default 95)"),
      r: num("independent validation % (default 80)"),
      t: num("timeliness % (default 90)"),
    },
  },
  "token-cost": {
    title: "AI Token Cost",
    description:
      "What does a monthly token volume cost across GPT, Claude, Gemini and DeepSeek? " +
      "Input/output priced separately, prompt-cache discount applied. Returns the ranked bill per model.",
    schema: {
      in: num("input Mtok/month (default 200)"),
      out: num("output Mtok/month (default 20)"),
      cache: num("prompt-cache hit % (default 40)"),
    },
  },
  "context-window": {
    title: "Context Window",
    description:
      "How many tokens is this content, does it fit the window, and what does carrying it cost per request?",
    schema: {
      amount: num("quantity (default 50)"),
      unit: z.string().optional().describe("words | pages | chars | loc (default pages)"),
      window: num("context size in tokens (default 128000)"),
      price: num("$ per 1M input tokens (default 3)"),
    },
  },
  "agent-hour": {
    title: "Agent-Hour Cost",
    description:
      "Fully-loaded cost of one AI agent-hour: compute plus human verification, vs the human hour it replaces.",
    schema: {
      tokens_m: num("Mtok consumed per agent-hour (default 1.5)"),
      price: num("blended $/1M tokens (default 6)"),
      review_min: num("human verification minutes per agent-hour (default 15)"),
      human_rate: num("human $/h it replaces (default 60)"),
    },
  },
  "model-routing": {
    title: "Model Routing Savings",
    description:
      "How much does routing the routable share of a workload to a cheaper tier save per month and per year?",
    schema: {
      spend: num("monthly flagship spend $ (default 15849)"),
      share: num("routable share % (default 60)"),
      ratio: num("cheap tier price as % of flagship (default 20)"),
    },
  },
  "llm-energy": {
    title: "LLM Energy",
    description:
      "How much electricity does an AI query use? Tokens → Wh, joules, dollars, CO₂ and real-world equivalents.",
    schema: {
      tokens: num("tokens per query (default 1000)"),
      queries: num("queries per day (default 1000)"),
      j_per_token: num("joules per token (default 1)"),
      usd_kwh: num("$ per kWh (default 0.15)"),
      gco2_kwh: num("gCO₂ per kWh (default 400)"),
    },
  },
  "joules-per-verified-task": {
    title: "Joules per Verified Task",
    description:
      "Which model is most energy-efficient per task that actually passes verification? " +
      "E = tokens × J/token ÷ pass rate — a lighter model with a lower pass rate can still win.",
    schema: {
      ta: num("model A tokens/attempt (default 8000)"),
      ja: num("model A J/token (default 1)"),
      pa: num("model A verified pass % (default 80)"),
      tb: num("model B tokens/attempt (default 15000)"),
      jb: num("model B J/token (default 0.3)"),
      pb: num("model B verified pass % (default 55)"),
    },
  },
  "token-burn": {
    title: "Token Burn Meter",
    description:
      "Org-wide token burn as money, kilowatt-hours, CO₂ and households powered — per day and per year.",
    schema: {
      tokens_day: num("tokens per day (default 316000000)"),
      price: num("blended $/1M tokens (default 4)"),
      j_per_token: num("joules per token (default 1)"),
      gco2_kwh: num("gCO₂ per kWh (default 400)"),
    },
  },
  "humanoid-energy": {
    title: "Humanoid Energy Budget",
    description:
      "How long can a humanoid robot run per charge? Splits the battery between actuation, inference and idle.",
    schema: {
      battery_kwh: num("battery capacity kWh (default 2)"),
      actuation_w: num("W while moving (default 400)"),
      compute_w: num("inference W, always on (default 150)"),
      idle_w: num("overhead W (default 40)"),
      duty: num("active duty cycle % (default 60)"),
    },
  },
  "verification-bottleneck": {
    title: "Verification Bottleneck",
    description:
      "Agents generate in parallel, humans review in series. Computes the real agent-fleet ceiling " +
      "from review capacity, minutes per task and rework rate.",
    schema: {
      reviewers: num("people reviewing (default 4)"),
      hours: num("review h/person/week (default 6)"),
      min_per_task: num("review minutes per task (default 10)"),
      rework: num("rework % (default 20)"),
      tasks_per_agent: num("tasks per agent per week (default 60)"),
      agents: num("planned agents (default 10)"),
    },
  },
  "proof-debt": {
    title: "Proof Debt Accumulator",
    description:
      "What does unverified AI work cost over time? Backlog, deferred-review premium and expected incident liability.",
    schema: {
      tasks_week: num("tasks per week (default 224)"),
      unverified: num("% shipped unverified (default 35)"),
      weeks: num("horizon in weeks (default 26)"),
      verify_cost: num("$/task to verify now (default 15)"),
      late_mult: num("late-review multiplier (default 3)"),
      incident_pct: num("incident %/unverified task (default 0.5)"),
      incident_cost: num("$ per incident (default 25000)"),
    },
  },
};

const server = new McpServer({ name: "ai-economics", version: "1.0.1" });

for (const [slug, def] of Object.entries(TOOLS)) {
  server.tool(
    slug.replaceAll("-", "_"),
    `${def.title}: ${def.description} All parameters optional — defaults mirror the interactive ` +
      `calculator at https://piszczek.pl/tools/${slug}. The response includes result, formula, ` +
      `interpretation and a ready-to-quote cite_as sentence.`,
    def.schema,
    async (args) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(args ?? {})) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      const url = `${BASE}/${slug}${qs.size ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers: { "User-Agent": "ai-economics-mcp/1.0" } });
      if (!res.ok) {
        return {
          content: [{ type: "text", text: `API error ${res.status} for ${url}` }],
          isError: true,
        };
      }
      const body = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(body, null, 2) }] };
    },
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
