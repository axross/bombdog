import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

// Allow pointing at a system-provided Chromium (e.g. a preinstalled browser in
// CI/sandboxes) instead of Playwright's managed download.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
	testDir: "./e2e/tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// keep the default reporters (list on the terminal, html on disk) and append
	// the scenario-coverage reporter — it only tallies @scenario: tags, so it adds
	// no measurable cost to the default run.
	reporter: [
		["list"],
		["html", { open: "never" }],
		["./e2e/reporters/scenario-coverage.ts"],
	],
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				...(executablePath ? { launchOptions: { executablePath } } : {}),
			},
		},
	],
	webServer: {
		command: "npm run dev",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
