import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
	FullResult,
	Reporter,
	TestCase,
	TestResult,
} from "@playwright/test/reporter";
import {
	AREA_TAG_PREFIX,
	AREAS,
	type Area,
	PRIORITIES,
	PRIORITY_TAG_PREFIX,
	type Priority,
	SCENARIO_TAG_PREFIX,
	SCENARIOS,
	type Scenario,
} from "../scenarios";

/**
 * Custom Playwright reporter that measures **scenario coverage**: which authored
 * user journeys (see `e2e/scenarios.ts`) the suite exercises with a passing test
 * tagged `@scenario:<id>`. It adds no application instrumentation and costs
 * nothing beyond bookkeeping, so it runs on the default `npm run test:e2e`.
 *
 * On `onEnd` it prints an overall + per-priority + per-area summary and a grouped
 * list of uncovered scenarios, writes a machine artifact for the gate check
 * script, and fails the run on any structural tag error (always, in every phase):
 *
 * - an `@scenario:` tag whose id is not in the catalog (a stale/typo tag), or
 * - a `@area:` / `@priority:` facet tag that disagrees with the catalog for the
 *   scenario(s) the test covers (missing or stray) — this keeps the greppable
 *   facet tags trustworthy for `--grep @priority:must` / `--grep @area:x`.
 */

// Playwright runs from the project root (where playwright.config.ts lives), so
// resolve the artifact relative to cwd. The reporter is transpiled to CommonJS
// by Playwright's loader, where import.meta is unavailable.
/** Where the machine-readable summary is written for the gate check script. */
const ARTIFACT_DIR = join(process.cwd(), "e2e", ".scenario-coverage");
const ARTIFACT_FILE = join(ARTIFACT_DIR, "summary.json");

interface Tally {
	covered: number;
	total: number;
}

interface Summary {
	generatedBy: string;
	overall: Tally & { pct: number };
	byPriority: Record<Priority, Tally>;
	byArea: Record<Area, Tally>;
	covered: string[];
	uncovered: Pick<Scenario, "id" | "title" | "area" | "priority">[];
	unknownScenarioTags: string[];
	facetErrors: string[];
}

const pct = (t: Tally): number =>
	t.total === 0 ? 100 : Math.round((t.covered / t.total) * 1000) / 10;

/** Collect the payloads of a test's tags that carry a given `@prefix:`. */
const tagValues = (tags: readonly string[], prefix: string): string[] =>
	tags.filter((t) => t.startsWith(prefix)).map((t) => t.slice(prefix.length));

export default class ScenarioCoverageReporter implements Reporter {
	private readonly coveredIds = new Set<string>();
	private readonly unknownScenarioTags = new Set<string>();
	private readonly facetErrors = new Set<string>();
	private readonly byId = new Map<string, Scenario>(
		SCENARIOS.map((s) => [s.id, s]),
	);

	onTestEnd(test: TestCase, result: TestResult): void {
		// validate tag structure on every attempt (independent of pass/fail); only
		// a passing test proves a journey works, so coverage is marked only then.
		const scenarioIds = tagValues(test.tags, SCENARIO_TAG_PREFIX);
		const known: Scenario[] = [];
		for (const id of scenarioIds) {
			const s = this.byId.get(id);
			if (s) {
				known.push(s);
				if (result.status === "passed") this.coveredIds.add(id);
			} else {
				this.unknownScenarioTags.add(`${SCENARIO_TAG_PREFIX}${id}`);
			}
		}
		this.validateFacets(test, known);
	}

	/**
	 * The `@area:` / `@priority:` tags on a test must be exactly the set implied by
	 * the scenarios it covers — no missing facet (else `--grep` misses the test)
	 * and no stray facet (else `--grep` over-selects it).
	 */
	private validateFacets(test: TestCase, known: Scenario[]): void {
		// unknown scenario tags already fail the run; skip facet noise for them.
		if (known.length === 0) {
			if (tagValues(test.tags, SCENARIO_TAG_PREFIX).length > 0) return;
		}
		const label = test.titlePath().slice(1).join(" › ") || test.title;
		const check = (kind: "area" | "priority", prefix: string) => {
			const expected = new Set<string>(known.map((s) => s[kind]));
			const actual = new Set<string>(tagValues(test.tags, prefix));
			for (const value of expected) {
				if (!actual.has(value)) {
					this.facetErrors.add(
						`"${label}" covers a ${kind}:${value} scenario but is missing tag ${prefix}${value}`,
					);
				}
			}
			for (const value of actual) {
				if (!expected.has(value)) {
					this.facetErrors.add(
						`"${label}" has stray tag ${prefix}${value} (no covered scenario is ${kind}:${value})`,
					);
				}
			}
		};
		check("area", AREA_TAG_PREFIX);
		check("priority", PRIORITY_TAG_PREFIX);
	}

	async onEnd(
		result: FullResult,
	): Promise<{ status: FullResult["status"] } | undefined> {
		const summary = this.buildSummary();
		this.writeArtifact(summary);
		this.print(summary);

		// structural tag errors are always failures — they silently corrupt the
		// metric. Fail the run regardless of gate phase (the `must` threshold gate
		// lives in the separate check script so the default run stays report-only).
		const hasStructuralError =
			summary.unknownScenarioTags.length > 0 || summary.facetErrors.length > 0;
		if (hasStructuralError && result.status === "passed") {
			return { status: "failed" };
		}
		return undefined;
	}

	private buildSummary(): Summary {
		const byPriority = Object.fromEntries(
			PRIORITIES.map((p) => [p, { covered: 0, total: 0 }]),
		) as Record<Priority, Tally>;
		const byArea = Object.fromEntries(
			AREAS.map((a) => [a, { covered: 0, total: 0 }]),
		) as Record<Area, Tally>;
		const overall: Tally = { covered: 0, total: 0 };
		const uncovered: Summary["uncovered"] = [];

		for (const s of SCENARIOS) {
			const isCovered = this.coveredIds.has(s.id);
			overall.total++;
			byPriority[s.priority].total++;
			byArea[s.area].total++;
			if (isCovered) {
				overall.covered++;
				byPriority[s.priority].covered++;
				byArea[s.area].covered++;
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
			byArea,
			covered: [...this.coveredIds].sort(),
			uncovered,
			unknownScenarioTags: [...this.unknownScenarioTags].sort(),
			facetErrors: [...this.facetErrors].sort(),
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
		const { overall, byPriority, byArea } = summary;
		lines.push(
			`  overall     ${overall.covered}/${overall.total}  (${overall.pct}%)`,
		);
		for (const p of PRIORITIES) {
			const t = byPriority[p];
			lines.push(`  ${p.padEnd(10)}  ${t.covered}/${t.total}  (${pct(t)}%)`);
		}
		lines.push("  by area:");
		for (const a of AREAS) {
			const t = byArea[a];
			lines.push(`    ${a.padEnd(12)}${t.covered}/${t.total}  (${pct(t)}%)`);
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

		if (summary.unknownScenarioTags.length > 0) {
			lines.push("");
			lines.push("  ⚠ Unknown @scenario: tags (not in the catalog — failing):");
			for (const tag of summary.unknownScenarioTags) lines.push(`    · ${tag}`);
		}

		if (summary.facetErrors.length > 0) {
			lines.push("");
			lines.push(
				"  ⚠ Facet-tag mismatches (not matching the catalog — failing):",
			);
			for (const err of summary.facetErrors) lines.push(`    · ${err}`);
		}

		lines.push("");
		console.log(lines.join("\n"));
	}
}
