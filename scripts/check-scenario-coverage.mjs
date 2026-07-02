#!/usr/bin/env node
/**
 * E2E scenario-coverage gate.
 *
 * Reads the artifact written by the scenario-coverage reporter
 * (`e2e/.scenario-coverage/summary.json`, produced by any `playwright test`
 * run) and enforces the gate:
 *
 *   - Structural tag errors always fail: an `@scenario:` tag not in the catalog
 *     (a stale/typo tag), or a `@area:`/`@priority:` facet tag that disagrees
 *     with the catalog. Both silently corrupt the metric.
 *   - Phase 2 only (`SCENARIO_GATE=must`, the default): every `must` scenario
 *     must be covered. `should`/`may` stay report-only.
 *
 * Flipping report-only ↔ enforce is a one-liner: set `SCENARIO_GATE`
 * (`must` = enforce, anything else = report-only). `npm run coverage:scenarios`
 * runs the suite and then this check.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ARTIFACT = join(here, "..", "e2e", ".scenario-coverage", "summary.json");

// `must` = enforce the hard gate (phase 2); any other value = report-only.
const GATE = process.env.SCENARIO_GATE ?? "must";

/** @param {string} message */
function fail(message) {
	console.error(`✗ scenario-coverage gate: ${message}`);
	process.exit(1);
}

let summary;
try {
	summary = JSON.parse(readFileSync(ARTIFACT, "utf8"));
} catch (error) {
	fail(
		`could not read ${ARTIFACT} — run the e2e suite first ` +
			`(npm run test:e2e). ${error instanceof Error ? error.message : error}`,
	);
}

const problems = [];

// structural errors are always a failure, in every phase.
if (Array.isArray(summary.catalogErrors) && summary.catalogErrors.length > 0) {
	problems.push(
		`catalog errors in e2e/scenarios.md:\n${summary.catalogErrors.map((e) => `    · ${e}`).join("\n")}`,
	);
}
if (
	Array.isArray(summary.unknownScenarioTags) &&
	summary.unknownScenarioTags.length > 0
) {
	problems.push(
		`unknown @scenario: tags (not in e2e/scenarios.md): ${summary.unknownScenarioTags.join(", ")}`,
	);
}
if (Array.isArray(summary.facetErrors) && summary.facetErrors.length > 0) {
	problems.push(
		`facet-tag mismatches:\n${summary.facetErrors.map((e) => `    · ${e}`).join("\n")}`,
	);
}

// phase 2: every `must` scenario must be covered.
if (GATE === "must") {
	const uncoveredMust = (summary.uncovered ?? []).filter(
		(s) => s.priority === "must",
	);
	if (uncoveredMust.length > 0) {
		problems.push(
			`${uncoveredMust.length} uncovered "must" scenario(s):\n` +
				uncoveredMust.map((s) => `    · ${s.id} — ${s.title}`).join("\n"),
		);
	}
}

const { overall, byPriority } = summary;
console.log(
	`scenario coverage: overall ${overall.covered}/${overall.total} (${overall.pct}%), ` +
		`must ${byPriority.must.covered}/${byPriority.must.total}` +
		(GATE === "must" ? " [gate: enforce must=100%]" : " [gate: report-only]"),
);

if (problems.length > 0) {
	fail(`\n  ${problems.join("\n  ")}`);
}

console.log("✓ scenario-coverage gate passed");
