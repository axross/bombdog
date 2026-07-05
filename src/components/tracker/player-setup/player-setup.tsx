"use client";

import { Bomb } from "lucide-react";
import { RadioGroup } from "radix-ui";
import type { JSX } from "react";
import { Button } from "@/components/ui/button/button";
import { WirePad } from "@/components/ui/wire-pad/wire-pad";
import { usePlayerSetupForm } from "@/hooks/use-player-setup-form";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/types";
import css from "./player-setup.module.css";

/**
 * First-run / post-reset screen: pick player count, names, and the Captain.
 * All form state and the roster assembly live in {@link usePlayerSetupForm};
 * this component only renders it.
 */
export function PlayerSetup(): JSX.Element {
	const form = usePlayerSetupForm();

	return (
		<main className={css.setup} data-testid="setup">
			<header className={css.header}>
				<h1 className={css.title}>
					<Bomb className={css.titleIcon} size={28} aria-hidden />
					Bombdog
				</h1>
				<p className={css.tagline}>
					Log every player's turn in Bomb Busters. Nothing to memorise.
				</p>
			</header>

			<div className={css.counter}>
				<span className={css.counterLabel}>Players</span>
				<div className={css.stepper}>
					<Button
						size="icon"
						className={css.stepButton}
						onClick={() => form.changeCount(form.count - 1)}
						disabled={form.count <= MIN_PLAYERS}
						aria-label="Remove a player"
					>
						−
					</Button>
					<span
						className={css.count}
						aria-live="polite"
						data-testid="player-count"
					>
						{form.count}
					</span>
					<Button
						size="icon"
						className={css.stepButton}
						onClick={() => form.changeCount(form.count + 1)}
						disabled={form.count >= MAX_PLAYERS}
						aria-label="Add a player"
					>
						+
					</Button>
				</div>
			</div>

			<label className={css.skip}>
				<input
					type="checkbox"
					checked={form.skipInfoTokens}
					onChange={(e) => form.setSkipInfoTokens(e.target.checked)}
					data-testid="skip-info-tokens"
				/>
				Skip starting info tokens
			</label>

			{/* The hint leads into the per-seat wire pads, so it is grouped with the
			    roster (tight gap) and kept clear of the skip toggle above it. */}
			<div className={css.roster}>
				{!form.skipInfoTokens && (
					<p className={css.infoHint}>
						Tap the wire each player marked with their info token.
					</p>
				)}
				<RadioGroup.Root
					className={css.seats}
					value={String(form.captainIndex)}
					onValueChange={(v) => form.setCaptainIndex(Number(v))}
					aria-label="Choose the Captain"
				>
					{Array.from({ length: form.count }, (_, i) => (
						// seats are positional: the seat index *is* the identity here
						// (the Captain is tracked by index), so an index key is correct.
						// biome-ignore lint/suspicious/noArrayIndexKey: seat identity is its position
						<div key={i} className={css.seat}>
							<div className={css.seatMain}>
								<RadioGroup.Item
									className={css.radio}
									value={String(i)}
									id={`captain-${i}`}
									aria-label={`Make player ${i + 1} the Captain`}
								>
									<RadioGroup.Indicator className={css.radioDot} />
								</RadioGroup.Item>
								<input
									className={css.nameInput}
									type="text"
									value={form.names[i]}
									onChange={(e) => form.setName(i, e.target.value)}
									// select the whole name on focus so typing replaces it
									// outright — players rarely tweak the default, they retype it.
									onFocus={(e) => e.target.select()}
									aria-label={`Name of player ${i + 1}`}
									maxLength={24}
								/>
								{form.captainIndex === i && (
									<span className={css.captainTag}>Captain</span>
								)}
							</div>
							{!form.skipInfoTokens && (
								<WirePad
									label="Info token"
									value={form.infoTokenBySeat[i] ?? null}
									onValueChange={(value) => form.setInfoToken(i, value)}
									blueOnly
									className={css.infoPad}
									data-testid={`info-token-${i}`}
								/>
							)}
						</div>
					))}
				</RadioGroup.Root>
			</div>

			<Button
				variant="primary"
				className={css.start}
				onClick={form.start}
				data-testid="start"
			>
				Start tracking
			</Button>
		</main>
	);
}
