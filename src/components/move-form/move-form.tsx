"use client";

import { clsx } from "clsx";
import { Tabs } from "radix-ui";
import type { JSX } from "react";
import { FieldHighlight } from "@/components/field-highlight/field-highlight";
import { OutcomeToggle } from "@/components/outcome-toggle/outcome-toggle";
import { PlayerPicker } from "@/components/player-picker/player-picker";
import {
	SelectField,
	type SelectOption,
} from "@/components/select-field/select-field";
import { WirePad } from "@/components/wire-pad/wire-pad";
import { formatWire, targetPlayerOrder, wireLabel } from "@/lib/game";
import {
	type BlueWireValueOrUnknown,
	DETECTOR_OPTIONS,
	type DetectorKind,
	detectorOption,
	EQUIPMENT_OPTIONS,
	GENERAL_RADAR_EQUIPMENT,
	type MoveType,
	type Player,
	POST_IT_EQUIPMENT,
} from "@/lib/types";
import { type DraftFields, detectorValues, type MoveFieldKey } from "./draft";
import css from "./move-form.module.css";

/**
 * An empty set reused when no fields are flagged, so the common case allocates
 * nothing and edit mode (which passes no flags) stays a no-op.
 */
const NO_INVALID: ReadonlySet<MoveFieldKey> = new Set();

/**
 * Props for {@link MoveForm}. The form is fully controlled: the parent owns the
 * action `type` and the `fields`, and is notified of every change.
 */
interface MoveFormProps {
	players: Player[];
	type: MoveType;
	/**
	 * When provided, the action-type tabs are shown (add mode).
	 */
	onTypeChange?: (type: MoveType) => void;
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
	/**
	 * Controls to flag as unselected/missing/invalid (see {@link MoveFieldKey}).
	 * Each matching field is wrapped in a highlight. Defaults to none, so the edit
	 * panel — which does not validate on press — renders unchanged.
	 */
	invalid?: ReadonlySet<MoveFieldKey>;
	/**
	 * Replays the highlight pulse when it changes; forwarded to each flagged field.
	 */
	nudge?: number;
}

const ACTIONS: { type: MoveType; label: string }[] = [
	{ type: "dual-cut", label: "Dual cut" },
	{ type: "solo-cut", label: "Solo cut" },
	{ type: "detector", label: "Detectors" },
	{ type: "equipment", label: "Misc" },
];

const ACTION_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	detector: "Detectors",
	equipment: "Misc",
};

const EQUIPMENT_SELECT_OPTIONS: SelectOption[] = EQUIPMENT_OPTIONS.map(
	(name) => ({
		value: name,
		label: name,
	}),
);

const DETECTOR_SELECT_OPTIONS: SelectOption[] = DETECTOR_OPTIONS.map((d) => ({
	value: d.kind,
	label: d.label,
}));

/**
 * The action-dependent controls that live inside the tab panel. Kept separate
 * so the add (tabs) and edit (fixed type) paths render identical inputs.
 */
function MoveFields({
	type,
	players,
	fields,
	onFieldsChange,
	invalid,
	nudge,
}: {
	type: MoveType;
	players: Player[];
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
	invalid: ReadonlySet<MoveFieldKey>;
	nudge: number;
}): JSX.Element {
	// props for a field's highlight wrapper: flagged state, the replay counter,
	// and a stable testid so tests and e2e can address each wrapper.
	const flag = (key: MoveFieldKey) => ({
		invalid: invalid.has(key),
		nudge,
		"data-testid": `highlight-${key}`,
	});
	// targets keep their play order (actor last), but self-targeting is legal
	// yet rare, so the acting player is folded out of the one-tap segmented row
	// into a trailing ⋯ overflow menu; every other player stays one tap.
	const orderedTargets = targetPlayerOrder(players, fields.actorId);
	const targetOptions: SelectOption[] = orderedTargets
		.filter((p) => p.id !== fields.actorId)
		.map((p) => ({ value: p.id, label: p.name }));
	const selfTargetOptions: SelectOption[] = orderedTargets
		.filter((p) => p.id === fields.actorId)
		.map((p) => ({ value: p.id, label: `${p.name} (self)` }));
	const update = (patch: Partial<DraftFields>) =>
		onFieldsChange({ ...fields, ...patch });

	// the structured equipment cards pick from every seat inline (no overflow
	// menu): a Post-it usually reveals the actor's own wire, and the radar's
	// holder subset can include anyone, so no choice is rare enough to fold.
	const seatOptions: SelectOption[] = players.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	const isDetector = type === "detector";
	const detector = detectorOption(fields.detector);
	const needsTarget = type === "dual-cut" || isDetector;
	const needsOutcome = type === "dual-cut" || isDetector;
	const needsSingleWire = type === "dual-cut" || type === "solo-cut";

	return (
		<div className={css.fields}>
			{isDetector && (
				<SelectField
					label="Equipment"
					value={fields.detector}
					onValueChange={(kind) =>
						// trim the selection to the new card's value count (e.g. dropping
						// down from the two-value X or Y Ray to a one-value detector), and
						// drop any X-or-Y-Ray cut value the old card may have carried.
						update({
							detector: kind as DetectorKind,
							values: detectorValues(fields.values, kind as DetectorKind),
							cutValue: null,
						})
					}
					options={DETECTOR_SELECT_OPTIONS}
					data-testid="detector"
				/>
			)}

			{needsTarget && (
				// a segmented control (one tap). the acting player's self-target is
				// folded into the ⋯ overflow menu since a self-dual-cut is rare; the
				// Super Detector points at a player's whole stand, so the same picker
				// (and its self entry) fits.
				<FieldHighlight {...flag("target")}>
					<PlayerPicker
						label={
							isDetector && detector.targetsWholeStand
								? "Target (whole stand)"
								: "Target"
						}
						value={fields.targetId}
						onValueChange={(targetId) => update({ targetId })}
						options={targetOptions}
						menuOptions={selfTargetOptions}
						menuLabel="Other targets"
						data-testid="target"
					/>
				</FieldHighlight>
			)}

			{needsSingleWire && (
				<FieldHighlight {...flag("wire")}>
					<WirePad
						label="Wire"
						value={fields.value}
						onValueChange={(value) => update({ value })}
						allowUnknown
						data-testid="wire-pad"
					/>
				</FieldHighlight>
			)}

			{isDetector && (
				<FieldHighlight {...flag("values")}>
					<WirePad
						label={detector.valueCount === 2 ? "Values (pick two)" : "Value"}
						multiple
						max={detector.valueCount}
						values={fields.values}
						onValuesChange={(values) =>
							// the pad is blue-only, so this narrows to blue values (still
							// possibly "?"); yellow can never be picked here. changing the named
							// values invalidates any X-or-Y-Ray cut value picked from them.
							update({
								values: values.filter(
									(v): v is BlueWireValueOrUnknown => v !== "yellow",
								),
								cutValue: null,
							})
						}
						blueOnly
						allowUnknown
						data-testid="wire-pad"
					/>
				</FieldHighlight>
			)}

			{needsOutcome && (
				<FieldHighlight {...flag("outcome")}>
					<OutcomeToggle
						label="Result"
						outcome={fields.outcome}
						revealed={fields.revealed}
						onChange={(outcome, revealed) =>
							// a fail has no single cut value; clear any X-or-Y-Ray pick.
							update({
								outcome,
								revealed,
								cutValue: outcome === "success" ? fields.cutValue : null,
							})
						}
						data-testid="outcome"
					/>
				</FieldHighlight>
			)}

			{isDetector &&
				fields.detector === "x-or-y-ray" &&
				fields.outcome === "success" &&
				fields.values.length === 2 && (
					// a successful X or Y Ray cut one of the two named wires; record
					// which so the status view can attribute the cut.
					<FieldHighlight {...flag("cutValue")}>
						<fieldset
							className={css.cutValue}
							aria-label="Actual cut value"
							data-testid="cut-value"
						>
							<span className={css.cutValueLabel}>Actual value</span>
							<div className={css.cutValueButtons}>
								{fields.values.map((value) => (
									<button
										key={String(value)}
										type="button"
										className={clsx(
											css.cutValueItem,
											value === "unknown" && css.cutValueUnknown,
										)}
										aria-pressed={fields.cutValue === value}
										aria-label={wireLabel(value)}
										onClick={() => update({ cutValue: value })}
										data-testid={`cut-value-${value}`}
									>
										{formatWire(value)}
									</button>
								))}
							</div>
						</fieldset>
					</FieldHighlight>
				)}

			{type === "equipment" && (
				<div className={css.equipment}>
					<FieldHighlight {...flag("equipment")}>
						<SelectField
							label="Equipment"
							value={fields.equipment}
							onValueChange={(equipment) => update({ equipment })}
							options={EQUIPMENT_SELECT_OPTIONS}
							placeholder="Which equipment?"
							data-testid="equipment"
						/>
					</FieldHighlight>
					{fields.equipment === POST_IT_EQUIPMENT && (
						<>
							{/* the target revealed one of their wires; blue-only pad, since
							    the card deals in numbered wires. */}
							<FieldHighlight {...flag("target")}>
								<PlayerPicker
									label="Target"
									value={fields.targetId}
									onValueChange={(targetId) => update({ targetId })}
									options={seatOptions}
									data-testid="target"
								/>
							</FieldHighlight>
							<FieldHighlight {...flag("wire")}>
								<WirePad
									label="Wire"
									value={fields.value}
									onValueChange={(value) => update({ value })}
									blueOnly
									data-testid="wire-pad"
								/>
							</FieldHighlight>
						</>
					)}
					{fields.equipment === GENERAL_RADAR_EQUIPMENT && (
						<>
							{/* the announced value plus everyone who declared holding it —
							    any subset of seats, including none (the radar found no one),
							    so the holders row itself is never flagged invalid. */}
							<FieldHighlight {...flag("wire")}>
								<WirePad
									label="Value"
									value={fields.value}
									onValueChange={(value) => update({ value })}
									blueOnly
									data-testid="wire-pad"
								/>
							</FieldHighlight>
							<PlayerPicker
								label="Holders"
								multiple
								values={fields.holderIds}
								onValuesChange={(holderIds) => update({ holderIds })}
								options={seatOptions}
								data-testid="holders"
							/>
						</>
					)}
					<label className={css.noteField}>
						<span className={css.noteLabel}>Note (optional)</span>
						<input
							className={css.noteInput}
							type="text"
							value={fields.note}
							onChange={(e) => update({ note: e.target.value })}
							placeholder="e.g. moved detonator back one"
						/>
					</label>
				</div>
			)}
		</div>
	);
}

/**
 * The shared input body for adding and editing a move. The acting player comes
 * first (it applies to every action); the action type is chosen with tabs whose
 * panel holds exactly the controls that action needs. In edit mode the type is
 * fixed, so the tab strip is replaced by a static header.
 */
export function MoveForm({
	players,
	type,
	onTypeChange,
	fields,
	onFieldsChange,
	invalid = NO_INVALID,
	nudge = 0,
}: MoveFormProps): JSX.Element {
	const playerOptions: SelectOption[] = players.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	return (
		<div className={css.form}>
			<FieldHighlight
				invalid={invalid.has("actor")}
				nudge={nudge}
				data-testid="highlight-actor"
			>
				<SelectField
					label="Acting"
					value={fields.actorId}
					onValueChange={(actorId) => onFieldsChange({ ...fields, actorId })}
					options={playerOptions}
					placeholder="Who is acting?"
					data-testid="acting"
				/>
			</FieldHighlight>

			{onTypeChange ? (
				<Tabs.Root
					className={css.card}
					value={type}
					onValueChange={(next) => onTypeChange(next as MoveType)}
				>
					<Tabs.List className={css.tabs} aria-label="Action type">
						{ACTIONS.map((action) => (
							<Tabs.Trigger
								key={action.type}
								value={action.type}
								className={css.tab}
								data-testid={`tab-${action.type}`}
							>
								{action.label}
							</Tabs.Trigger>
						))}
					</Tabs.List>
					{ACTIONS.map((action) => (
						<Tabs.Content
							key={action.type}
							value={action.type}
							className={css.panel}
						>
							<MoveFields
								type={action.type}
								players={players}
								fields={fields}
								onFieldsChange={onFieldsChange}
								invalid={invalid}
								nudge={nudge}
							/>
						</Tabs.Content>
					))}
				</Tabs.Root>
			) : (
				<div className={css.card}>
					<p className={css.staticHeader}>{ACTION_LABEL[type]}</p>
					<div className={css.panel}>
						<MoveFields
							type={type}
							players={players}
							fields={fields}
							onFieldsChange={onFieldsChange}
							invalid={invalid}
							nudge={nudge}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
