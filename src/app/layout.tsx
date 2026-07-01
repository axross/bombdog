import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./layers.css";
import "./globals.css";
import "./variables.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Bombdog",
	description:
		"Log every player's turn in the board game Bomb Busters — dual cuts, solo cuts, double detectors, and equipment — with persistent history.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fbfdff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0d1520" },
	],
};

// Blocking script: set the theme class before first paint so dark-mode users
// never see a light flash. The app requires JS (IndexedDB/zustand), so this is
// a safe, dependency-free way to drive Radix's class-scoped dark palette.
const themeScript = `(function(){try{var m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var d=document.documentElement.classList;d.toggle("dark",m.matches);d.toggle("light",!m.matches);}a();m.addEventListener("change",a);}catch(e){}})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		// suppressHydrationWarning: the theme script adds a dark/light class to
		// <html> before hydration, which would otherwise flag a class mismatch.
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable}`}
			suppressHydrationWarning
		>
			<body>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, self-authored theme bootstrap */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				{children}
			</body>
		</html>
	);
}
