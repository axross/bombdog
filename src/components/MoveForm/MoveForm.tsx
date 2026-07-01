"use client";

import { Tabs } from "radix-ui";
import { OutcomeToggle } from "@/components/OutcomeToggle/OutcomeToggle";
import {
	SelectField,
	type SelectOption,
} from "@/components/SelectField/SelectField";
import { WirePad } from "@/components/WirePad/WirePad";
import { targetPlayerOrder } from "@/lib/game";
import { EQUIPMENT_OPTIONS, type MoveType, type Player } from "@/lib/types";
import type { DraftFields } from "./draft";
import styles from "./MoveForm.module.css";

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
}) {
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
		<div className={styles.fields}>
			{needsTarget && (
				// The acting player is intentionally included: some mission rules
				// allow a self-dual-cut.
				<SelectField
					label="Target"
					value={fields.targetId}
					onValueChange={(targetId) => update({ targetId })}
					options={targetOptions}
					placeholder="Target player"
				/>
			)}

			{needsWire && (
				<WirePad
					value={fields.value}
					onValueChange={(value) => update({ value })}
					blueOnly={type === "double-detector"}
				/>
			)}

			{needsOutcome && (
				<OutcomeToggle
					value={fields.outcome}
					onValueChange={(outcome) => update({ outcome })}
				/>
			)}

			{type === "equipment" && (
				<div className={styles.equipment}>
					<SelectField
						label="Equipment"
						value={fields.equipment}
						onValueChange={(equipment) => update({ equipment })}
						options={EQUIPMENT_SELECT_OPTIONS}
						placeholder="Which equipment?"
					/>
					<label className={styles.noteField}>
						<span className={styles.noteLabel}>Note (optional)</span>
						<input
							className={styles.noteInput}
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
}: MoveFormProps) {
	const playerOptions: SelectOption[] = players.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	return (
		<div className={styles.form}>
			<SelectField
				label="Acting"
				value={fields.actorId}
				onValueChange={(actorId) => onFieldsChange({ ...fields, actorId })}
				options={playerOptions}
				placeholder="Who is acting?"
			/>

			{onTypeChange ? (
				<Tabs.Root
					className={styles.card}
					value={type}
					onValueChange={(next) => onTypeChange(next as MoveType)}
				>
					<Tabs.List className={styles.tabs} aria-label="Action type">
						{ACTIONS.map((action) => (
							<Tabs.Trigger
								key={action.type}
								value={action.type}
								className={styles.tab}
							>
								{action.label}
							</Tabs.Trigger>
						))}
					</Tabs.List>
					{ACTIONS.map((action) => (
						<Tabs.Content
							key={action.type}
							value={action.type}
							className={styles.panel}
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
				<div className={styles.card}>
					<p className={styles.staticHeader}>{ACTION_LABEL[type]}</p>
					<div className={styles.panel}>
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
