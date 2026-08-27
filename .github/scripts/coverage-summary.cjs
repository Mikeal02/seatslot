const fs = require("fs");

const path = "./coverage/coverage-summary.json";
if (!fs.existsSync(path)) process.exit(0);

const total = JSON.parse(fs.readFileSync(path, "utf8")).total;
const rows = ["lines", "statements", "functions", "branches"]
  .map(
    (key) =>
      `| ${key} | ${total[key].pct}% | ${total[key].covered}/${total[key].total} |`,
  )
  .join("\n");

const summary = `## Coverage\n\n| Metric | % | Covered |\n| --- | --- | --- |\n${rows}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
console.log(summary);
