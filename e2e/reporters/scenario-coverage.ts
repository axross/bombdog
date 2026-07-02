import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
	FullResult,
	Reporter,
	TestCase,
	TestResult,
} from "@playwright/test/reporter";
import {
	type Priority,
	SCENARIOS,
	SCN_TAG_PREFIX,
	type Scenario,
} from "../scenarios";

/**
 * Custom Playwright reporter that measures **scenario coverage**: which authored
 * user journeys (see `e2e/scenarios.ts`) the suite exercises with a passing,
 * `@scn:`-tagged test. It adds no application instrumentation and costs nothing
 * beyond bookkeeping, so it runs on the default `npm run test:e2e`.
 *
 * On `onEnd` it prints an overall + per-priority summary and a grouped list of
 * uncovered scenarios, writes a machine artifact for the gate check script, and
 * fails the run if any tag references an id that is not in the catalog (a stale
 * or typo'd tag — always an error, in every phase).
 */

// Playwright runs from the project root (where playwright.config.ts lives), so
// resolve the artifact relative to cwd. The reporter is transpiled to CommonJS
// by Playwright's loader, where import.meta is unavailable.
/** Where the machine-readable summary is written for the gate check script. */
const ARTIFACT_DIR = join(process.cwd(), "e2e", ".scenario-coverage");
const ARTIFACT_FILE = join(ARTIFACT_DIR, "summary.json");

const PRIORITIES: readonly Priority[] = ["must", "should", "may"];

interface Tally {
	covered: number;
	total: number;
}

interface Summary {
	generatedBy: string;
	overall: Tally & { pct: number };
	byPriority: Record<Priority, Tally>;
	covered: string[];
	uncovered: Pick<Scenario, "id" | "title" | "area" | "priority">[];
	unknownTags: string[];
}

const pct = (t: Tally): number =>
	t.total === 0 ? 100 : Math.round((t.covered / t.total) * 1000) / 10;

export default class ScenarioCoverageReporter implements Reporter {
	private readonly coveredIds = new Set<string>();
	private readonly unknownTags = new Set<string>();
	private readonly catalogIds = new Set<string>(SCENARIOS.map((s) => s.id));

	onTestEnd(test: TestCase, result: TestResult): void {
		// only a passing test proves a journey works; a failed/skipped test
		// correctly leaves its scenario uncovered.
		if (result.status !== "passed") return;
		for (const tag of test.tags) {
			if (!tag.startsWith(SCN_TAG_PREFIX)) continue;
			const id = tag.slice(SCN_TAG_PREFIX.length);
			if (this.catalogIds.has(id)) {
				this.coveredIds.add(id);
			} else {
				this.unknownTags.add(tag);
			}
		}
	}

	async onEnd(
		result: FullResult,
	): Promise<{ status: FullResult["status"] } | undefined> {
		const summary = this.buildSummary();
		this.writeArtifact(summary);
		this.print(summary);

		// a stale/typo tag is always an error — it silently loses coverage.
		// fail the run regardless of gate phase (the `must` gate lives in the
		// separate check script so the default run stays report-only for it).
		if (summary.unknownTags.length > 0 && result.status === "passed") {
			return { status: "failed" };
		}
		return undefined;
	}

	private buildSummary(): Summary {
		const byPriority = Object.fromEntries(
			PRIORITIES.map((p) => [p, { covered: 0, total: 0 }]),
		) as Record<Priority, Tally>;
		const overall: Tally = { covered: 0, total: 0 };
		const uncovered: Summary["uncovered"] = [];

		for (const s of SCENARIOS) {
			const isCovered = this.coveredIds.has(s.id);
			overall.total++;
			byPriority[s.priority].total++;
			if (isCovered) {
				overall.covered++;
				byPriority[s.priority].covered++;
			} else {
				uncovered.push({
					id: s.id,
					title: s.title,
					area: s.area,
					priority: s.priority,
				});
			}
		}

		return {
			generatedBy: "scenario-coverage-reporter",
			overall: { ...overall, pct: pct(overall) },
			byPriority,
			covered: [...this.coveredIds].sort(),
			uncovered,
			unknownTags: [...this.unknownTags].sort(),
		};
	}

	private writeArtifact(summary: Summary): void {
		mkdirSync(ARTIFACT_DIR, { recursive: true });
		writeFileSync(ARTIFACT_FILE, `${JSON.stringify(summary, null, 2)}\n`);
	}

	private print(summary: Summary): void {
		const lines: string[] = [];
		lines.push("");
		lines.push("E2E scenario coverage (user journeys, not lines)");
		lines.push("────────────────────────────────────────────────");
		const { overall, byPriority } = summary;
		lines.push(
			`  overall   ${overall.covered}/${overall.total}  (${overall.pct}%)`,
		);
		for (const p of PRIORITIES) {
			const t = byPriority[p];
			lines.push(`  ${p.padEnd(8)}  ${t.covered}/${t.total}  (${pct(t)}%)`);
		}

		if (summary.uncovered.length > 0) {
			lines.push("");
			lines.push("  Uncovered scenarios (must first):");
			const ordered = [...summary.uncovered].sort(
				(a, b) =>
					PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
					a.area.localeCompare(b.area) ||
					a.id.localeCompare(b.id),
			);
			for (const s of ordered) {
				lines.push(`    · [${s.priority}] ${s.id} — ${s.title}`);
			}
		}

		if (summary.unknownTags.length > 0) {
			lines.push("");
			lines.push("  ⚠ Unknown @scn: tags (not in the catalog — failing run):");
			for (const tag of summary.unknownTags) lines.push(`    · ${tag}`);
		}

		lines.push("");
		console.log(lines.join("\n"));
	}
}
