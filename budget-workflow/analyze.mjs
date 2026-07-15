import { OpenMultiAgent } from "@open-multi-agent/core";

const model = process.env.OMA_MODEL ?? "claude-sonnet-4-20250514";
const defaultProvider = process.env.OMA_PROVIDER ?? "anthropic";
const defaultBaseURL = process.env.OMA_BASE_URL;

const costData = process.env.COST_DATA_PATH
  ? await import("fs").then((fs) => fs.readFileSync(process.env.COST_DATA_PATH, "utf-8"))
  : process.argv[2] || "No cost data provided. Run a generic budget review.";

const agents = [
  {
    name: "analyst",
    model,
    systemPrompt: `You are a cloud cost optimization expert. Analyze the cost data for waste, unused resources, oversized instances, and savings opportunities. Be specific with numbers and recommendations.`,
    tools: ["file_read", "grep"],
  },
  {
    name: "reporter",
    model,
    systemPrompt: `You are a report generator. Take the analyst's findings and produce a structured budget report with: summary, top savings opportunities (ranked), estimated monthly savings, action items. Format as markdown.`,
    tools: ["file_write"],
  },
  {
    name: "github-actions",
    model,
    systemPrompt: `You create GitHub issues for each action item in the budget report. Output a JSON array of issue titles and bodies. Do NOT create actual issues — just output the plan.`,
    tools: [],
  },
];

const orchestrator = new OpenMultiAgent({
  defaultProvider,
  defaultModel: model,
  defaultBaseURL,
  onProgress: (event) => {
    if (event.type === "task_start" || event.type === "task_complete") {
      console.log(`  [${event.type}] ${event.task ?? ""}`);
    }
  },
});

const team = orchestrator.createTeam("budget-team", {
  name: "budget-team",
  agents,
  sharedMemory: true,
});

const result = await orchestrator.runTeam(
  team,
  `Analyze the following cloud cost data and produce a budget optimization report:

${costData}

1. Analyst: identify all cost-saving opportunities with specific numbers
2. Reporter: create a detailed markdown report
3. GitHub Actions: list action items as JSON for issue creation`,
);

console.log("\n=== RESULT ===");
console.log(result.success ? "SUCCESS" : "FAILED");
console.log("Tokens used:", result.totalTokenUsage?.output_tokens ?? "unknown");

if (result.success) {
  const reportPath = process.env.REPORT_PATH ?? "./budget-report.md";
  await import("fs").then((fs) =>
    fs.writeFileSync(reportPath, JSON.stringify(result.output, null, 2))
  );
  console.log(`Report saved to: ${reportPath}`);
}
