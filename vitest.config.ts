import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.{ts,tsx}"],
			// Framework route entrypoints (no logic) and spec files carry no
			// testable branches of their own.
			exclude: [
				"src/**/*.{test,spec}.{ts,tsx}",
				"src/app/layout.tsx",
				"src/app/page.tsx",
			],
			thresholds: {
				branches: 95,
				functions: 95,
				lines: 95,
				statements: 95,
			},
		},
	},
	resolve: {
		alias: {
			"@": new URL("./src", import.meta.url).pathname,
		},
	},
});
