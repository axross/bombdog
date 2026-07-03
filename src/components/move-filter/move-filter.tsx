"use client";

import { clsx } from "clsx";
import { Check, ListFilter } from "lucide-react";
import { Dialog } from "radix-ui";
import type { JSX } from "react";
import { isFilterActive } from "@/lib/game";
import { EMPTY_MOVE_FILTER, type MoveFilter as Filter } from "@/lib/types";
import css from "./move-filter.module.css";

/**
 * Props for {@link MoveFilter}: the current filter and its change handler.
 */
interface MoveFilterProps {
	filter: Filter;
	onChange: (filter: Filter) => void;
}

/**
 * The move-log filter: a trigger button that opens a dialog for hiding move
 * types. The trigger is meant to sit in the app header, so it stays in view
 * while the history scrolls below it.
 */
export function MoveFilter({ filter, onChange }: MoveFilterProps): JSX.Element {
	const active = isFilterActive(filter);
	const bothExcluded = filter.excludeSuccessfulDualCut && filter.excludeSoloCut;

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className={clsx(css.trigger, active && css.triggerActive)}
					aria-label={active ? "Filter (active)" : "Filter"}
					data-testid="filter"
				>
					<ListFilter size={16} aria-hidden />
					Filter
					{active && (
						<span className={css.dot} aria-hidden data-testid="filter-active" />
					)}
				</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={css.overlay} />
				<Dialog.Content
					className={css.content}
					aria-describedby={undefined}
					data-testid="filter-dialog"
				>
					<Dialog.Title className={css.title}>Filter moves</Dialog.Title>
					<p className={css.hint}>Hide the move types you don't need to see.</p>

					{/* shortcut above the individual toggles: turn both exclusions on
					    (or off again once both are set) in a single tap. it is a plain
					    action, not a toggle, so it carries no aria-pressed state — that
					    would read as "off" in the mixed (one-exclusion) case. */}
					<button
						type="button"
						className={css.both}
						onClick={() =>
							onChange({
								excludeSuccessfulDualCut: !bothExcluded,
								excludeSoloCut: !bothExcluded,
							})
						}
						data-testid="filter-exclude-both"
					>
						{bothExcluded ? "Clear both" : "Exclude both"}
					</button>

					<div className={css.toggles}>
						<button
							type="button"
							className={css.toggle}
							aria-pressed={filter.excludeSuccessfulDualCut}
							onClick={() =>
								onChange({
									...filter,
									excludeSuccessfulDualCut: !filter.excludeSuccessfulDualCut,
								})
							}
							data-testid="filter-exclude-dual-cut"
						>
							<span className={css.check} aria-hidden>
								{filter.excludeSuccessfulDualCut && <Check size={15} />}
							</span>
							Exclude successful dual cuts
						</button>
						<button
							type="button"
							className={css.toggle}
							aria-pressed={filter.excludeSoloCut}
							onClick={() =>
								onChange({
									...filter,
									excludeSoloCut: !filter.excludeSoloCut,
								})
							}
							data-testid="filter-exclude-solo-cut"
						>
							<span className={css.check} aria-hidden>
								{filter.excludeSoloCut && <Check size={15} />}
							</span>
							Exclude solo cuts
						</button>
					</div>

					<div className={css.footer}>
						{/* kept enabled even when inactive: disabling the focused Reset
						    button right after a keyboard user activates it would drop focus
						    out of the dialog to <body>. it no-ops when nothing is excluded,
						    and aria-disabled conveys the state without losing focus. */}
						<button
							type="button"
							className={css.reset}
							onClick={() => active && onChange(EMPTY_MOVE_FILTER)}
							aria-disabled={!active}
							data-testid="filter-reset"
						>
							Clear
						</button>
						<Dialog.Close asChild>
							<button
								type="button"
								className={css.done}
								data-testid="filter-done"
							>
								Done
							</button>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
