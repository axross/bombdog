"use client";

import { ActionSelector } from "@/components/ActionSelector/ActionSelector";
import { OutcomeToggle } from "@/components/OutcomeToggle/OutcomeToggle";
import {
	SelectField,
	type SelectOption,
} from "@/components/SelectField/SelectField";
import { WirePad } from "@/components/WirePad/WirePad";
import { EQUIPMENT_OPTIONS, type MoveType, type Player } from "@/lib/types";
import type { DraftFields } from "./draft";
import styles from "./MoveForm.module.css";

interface MoveFormProps {
	players: Player[];
	type: MoveType;
	/** When provided, the action-type selector is shown (add mode). */
	onTypeChange?: (type: MoveType) => void;
	fields: DraftFields;
	onFieldsChange: (fields: DraftFields) => void;
}

const EQUIPMENT_SELECT_OPTIONS: SelectOption[] = EQUIPMENT_OPTIONS.map(
	(name) => ({
		value: name,
		label: name,
	}),
);

/**
 * The shared input body for adding and editing a move. It renders exactly the
 * controls the chosen action needs (see the composer input matrix), so add and
 * edit always stay consistent.
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
	const update = (patch: Partial<DraftFields>) =>
		onFieldsChange({ ...fields, ...patch });

	const needsTarget = type === "dual-cut" || type === "double-detector";
	const needsOutcome = type === "dual-cut" || type === "double-detector";
	const needsWire =
		type === "dual-cut" || type === "solo-cut" || type === "double-detector";

	return (
		<div className={styles.form}>
			{onTypeChange && (
				<ActionSelector value={type} onValueChange={onTypeChange} />
			)}

			<div className={styles.players}>
				<SelectField
					label="Acting"
					value={fields.actorId}
					onValueChange={(actorId) => update({ actorId })}
					options={playerOptions}
					placeholder="Who is acting?"
				/>
				{needsTarget && (
					// The acting player is intentionally included: some mission rules
					// allow a self-dual-cut.
					<SelectField
						label="Target"
						value={fields.targetId}
						onValueChange={(targetId) => update({ targetId })}
						options={playerOptions}
						placeholder="Target player"
					/>
				)}
			</div>

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
