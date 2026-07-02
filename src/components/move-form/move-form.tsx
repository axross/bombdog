"use client";

import { Tabs } from "radix-ui";
import type { JSX } from "react";
import { OutcomeToggle } from "@/components/outcome-toggle/outcome-toggle";
import { PlayerPicker } from "@/components/player-picker/player-picker";
import {
	SelectField,
	type SelectOption,
} from "@/components/select-field/select-field";
import { WirePad } from "@/components/wire-pad/wire-pad";
import { targetPlayerOrder } from "@/lib/game";
import {
	type BlueWireValueOrUnknown,
	DETECTOR_OPTIONS,
	type DetectorKind,
	detectorOption,
	EQUIPMENT_OPTIONS,
	type MoveType,
	type Player,
} from "@/lib/types";
import { type DraftFields, detectorValues } from "./draft";
import css from "./move-form.module.css";

/**
 *
 * Props for {@link MoveForm}. The form is fully controlled: the parent owns the
 * action `type` and the `fields`, and is notified of every change.
 *
 */
interface MoveFormProps {
	players: Player[];
	type: MoveType;
	/**
	 *
	 * When provided, the action-type tabs are shown (add mode).
	 *
	 */
	onTypeChange?: (type: MoveType) => void;
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
}

const ACTIONS: { type: MoveType; label: string }[] = [
	{ type: "dual-cut", label: "Dual cut" },
	{ type: "solo-cut", label: "Solo cut" },
	{ type: "detector", label: "Detectors" },
	{ type: "equipment", label: "Equipment" },
];

const ACTION_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	detector: "Detectors",
	equipment: "Equipment",
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
 *
 * The action-dependent controls that live inside the tab panel. Kept separate
 * so the add (tabs) and edit (fixed type) paths render identical inputs.
 *
 */
function MoveFields({
	type,
	players,
	fields,
	onFieldsChange,
}: {
	type: MoveType;
	players: Player[];
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
}): JSX.Element {
	// targets list everyone, but the acting player is pushed last (self-target
	// is legal yet rare) and flagged so it reads clearly.
	const targetOptions: SelectOption[] = targetPlayerOrder(
		players,
		fields.actorId,
	).map((p) => ({
		value: p.id,
		label: p.id === fields.actorId ? `${p.name} (self)` : p.name,
	}));
	const update = (patch: Partial<DraftFields>) =>
		onFieldsChange({ ...fields, ...patch });

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
						// down from the two-value X or Y Ray to a one-value detector).
						update({
							detector: kind as DetectorKind,
							values: detectorValues(fields.values, kind as DetectorKind),
						})
					}
					options={DETECTOR_SELECT_OPTIONS}
					data-testid="detector"
				/>
			)}

			{needsTarget && (
				// a segmented control (one tap). the acting player is intentionally
				// included last: some mission rules allow a self-dual-cut. the Super
				// Detector points at a player's whole stand, so the same picker fits.
				<PlayerPicker
					label={
						isDetector && detector.targetsWholeStand
							? "Target (whole stand)"
							: "Target"
					}
					value={fields.targetId}
					onValueChange={(targetId) => update({ targetId })}
					options={targetOptions}
					data-testid="target"
				/>
			)}

			{needsSingleWire && (
				<WirePad
					label="Wire"
					value={fields.value}
					onValueChange={(value) => update({ value })}
					allowUnknown
					data-testid="wire-pad"
				/>
			)}

			{isDetector && (
				<WirePad
					label={detector.valueCount === 2 ? "Values (pick two)" : "Value"}
					multiple
					max={detector.valueCount}
					values={fields.values}
					onValuesChange={(values) =>
						// the pad is blue-only, so this narrows to blue values (still
						// possibly "?"); yellow can never be picked here.
						update({
							values: values.filter(
								(v): v is BlueWireValueOrUnknown => v !== "yellow",
							),
						})
					}
					blueOnly
					allowUnknown
					data-testid="wire-pad"
				/>
			)}

			{needsOutcome && (
				<OutcomeToggle
					label="Result"
					outcome={fields.outcome}
					revealed={fields.revealed}
					onChange={(outcome, revealed) => update({ outcome, revealed })}
					data-testid="outcome"
				/>
			)}

			{type === "equipment" && (
				<div className={css.equipment}>
					<SelectField
						label="Equipment"
						value={fields.equipment}
						onValueChange={(equipment) => update({ equipment })}
						options={EQUIPMENT_SELECT_OPTIONS}
						placeholder="Which equipment?"
						data-testid="equipment"
					/>
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
 *
 * The shared input body for adding and editing a move. The acting player comes
 * first (it applies to every action); the action type is chosen with tabs whose
 * panel holds exactly the controls that action needs. In edit mode the type is
 * fixed, so the tab strip is replaced by a static header.
 *
 */
export function MoveForm({
	players,
	type,
	onTypeChange,
	fields,
	onFieldsChange,
}: MoveFormProps): JSX.Element {
	const playerOptions: SelectOption[] = players.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	return (
		<div className={css.form}>
			<SelectField
				label="Acting"
				value={fields.actorId}
				onValueChange={(actorId) => onFieldsChange({ ...fields, actorId })}
				options={playerOptions}
				placeholder="Who is acting?"
				data-testid="acting"
			/>

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
						/>
					</div>
				</div>
			)}
		</div>
	);
}
