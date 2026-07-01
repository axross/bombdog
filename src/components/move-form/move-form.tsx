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
import { EQUIPMENT_OPTIONS, type MoveType, type Player } from "@/lib/types";
import type { DraftFields } from "./draft";
import css from "./move-form.module.css";

interface MoveFormProps {
	players: Player[];
	type: MoveType;
	/** When provided, the action-type tabs are shown (add mode). */
	onTypeChange?: (type: MoveType) => void;
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
}

const ACTIONS: { type: MoveType; label: string }[] = [
	{ type: "dual-cut", label: "Dual cut" },
	{ type: "solo-cut", label: "Solo cut" },
	{ type: "double-detector", label: "Double detector" },
	{ type: "equipment", label: "Equipment" },
];

const ACTION_LABEL: Record<MoveType, string> = {
	"dual-cut": "Dual cut",
	"solo-cut": "Solo cut",
	"double-detector": "Double detector",
	equipment: "Equipment",
};

const EQUIPMENT_SELECT_OPTIONS: SelectOption[] = EQUIPMENT_OPTIONS.map(
	(name) => ({
		value: name,
		label: name,
	}),
);

/**
 * The action-dependent controls that live inside the tab panel. Kept separate
 * so the add (tabs) and edit (fixed type) paths render identical inputs.
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
	// Targets list everyone, but the acting player is pushed last (self-target
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

	const needsTarget = type === "dual-cut" || type === "double-detector";
	const needsOutcome = type === "dual-cut" || type === "double-detector";
	const needsWire =
		type === "dual-cut" || type === "solo-cut" || type === "double-detector";

	return (
		<div className={css.fields}>
			{needsTarget && (
				// A segmented control (one tap). The acting player is intentionally
				// included last: some mission rules allow a self-dual-cut.
				<PlayerPicker
					label="Target"
					value={fields.targetId}
					onValueChange={(targetId) => update({ targetId })}
					options={targetOptions}
					data-testid="target"
				/>
			)}

			{needsWire && (
				<WirePad
					value={fields.value}
					onValueChange={(value) => update({ value })}
					blueOnly={type === "double-detector"}
					data-testid="wire-pad"
				/>
			)}

			{needsOutcome && (
				<OutcomeToggle
					value={fields.outcome}
					onValueChange={(outcome) => update({ outcome })}
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
