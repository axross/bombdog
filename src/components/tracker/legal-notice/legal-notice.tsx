import { clsx } from "clsx";
import type { JSX } from "react";
import css from "./legal-notice.module.css";

/**
 * BoardGameGeek entry for Bomb Busters — the canonical reference for the game.
 */
const GAME_URL = "https://boardgamegeek.com/boardgame/413246/bomb-busters";

/**
 * The app's legal notice, shown at the bottom of the setup screen. Bombdog is an
 * unofficial companion to the board game Bomb Busters, so it must disclaim any
 * affiliation and attribute the game to its rights holders; the copyright line
 * covers Bombdog itself. `className` lets the parent own its outer spacing.
 */
export function LegalNotice({
	className,
}: {
	className?: string;
}): JSX.Element {
	return (
		// role="contentinfo": nested inside <main>, a bare <footer> loses its
		// implicit contentinfo landmark, so restore it explicitly for AT navigation.
		<footer
			className={clsx(css.notice, className)}
			role="contentinfo"
			data-testid="legal-notice"
		>
			<p>
				Bombdog is an unofficial, fan-made companion and is not affiliated with,
				endorsed by, or associated with Cocktail Games or the creators of{" "}
				<a
					className={css.link}
					href={GAME_URL}
					target="_blank"
					rel="noreferrer"
				>
					Bomb Busters
				</a>
				.
			</p>
			<p>
				Bomb Busters and all related names, marks, and game content are
				trademarks and copyright of Cocktail Games and their respective owners.
			</p>
			<p className={css.copyright}>© 2026 axross</p>
		</footer>
	);
}
