"use client";

import type { JSX } from "react";
import { SegmentedPicker } from "@/components/primitives/segmented-picker/segmented-picker";
import type { SelectOption } from "@/components/primitives/select-field/select-field";
import { targetPlayerOrder } from "@/lib/game";
import type { Player } from "@/lib/types";

/**
 * Options shared by both selection modes of {@link PlayerPicker}.
 */
interface BaseProps {
	label: string;
	/**
	 * The roster to pick from, in seat order.
	 */
	players: Player[];
	className?: string;
	"data-testid"?: string;
}

/**
 * Single-select picker: exactly one player (or none yet).
 */
interface SingleProps extends BaseProps {
	multiple?: false;
	value: string;
	onValueChange: (value: string) => void;
	/**
	 * Fold this player (the actor targeting themselves) out of the one-tap
	 * segmented row into the trailing ⋯ overflow menu, labelled "(self)" —
	 * self-targeting is legal but rare. The remaining players keep their play
	 * order (relative to this actor). Omit to list every player inline.
	 */
	foldSelfId?: string;
	/**
	 * Accessible label for the ⋯ overflow trigger; applies with `foldSelfId`.
	 */
	menuLabel?: string;
}

/**
 * Multi-select picker: any subset of players, including none (e.g. the General
 * Radar's holder selection).
 */
interface MultiProps extends BaseProps {
	multiple: true;
	values: string[];
	onValuesChange: (values: string[]) => void;
}

/**
 * A {@link PlayerPicker} in either mode, discriminated by the `multiple` flag.
 */
type PlayerPickerProps = SingleProps | MultiProps;

function toOption(player: Player): SelectOption {
	return { value: player.id, label: player.name };
}

/**
 * The player-choosing control: the roster rendered through the generic
 * {@link SegmentedPicker}, one tap per player. This layer owns the domain
 * mapping — seat/play ordering, the rare self-target folded into the ⋯
 * overflow menu with a "(self)" label — while the primitive owns the control
 * mechanics.
 */
export function PlayerPicker(props: PlayerPickerProps): JSX.Element {
	const { label, players, className } = props;
	const dataTestId = props["data-testid"];

	if (props.multiple) {
		return (
			<SegmentedPicker
				label={label}
				multiple
				values={props.values}
				onValuesChange={props.onValuesChange}
				options={players.map(toOption)}
				className={className}
				data-testid={dataTestId}
			/>
		);
	}

	const { value, onValueChange, foldSelfId, menuLabel } = props;
	// targets keep their play order (actor last); the actor's own entry moves
	// to the overflow menu so the common one-tap targets stay uncrowded.
	const ordered =
		foldSelfId === undefined ? players : targetPlayerOrder(players, foldSelfId);
	const rowOptions = ordered.filter((p) => p.id !== foldSelfId).map(toOption);
	const menuOptions = ordered
		.filter((p) => p.id === foldSelfId)
		.map((p) => ({ value: p.id, label: `${p.name} (self)` }));

	return (
		<SegmentedPicker
			label={label}
			value={value}
			onValueChange={onValueChange}
			options={rowOptions}
			menuOptions={menuOptions}
			menuLabel={menuLabel}
			className={className}
			data-testid={dataTestId}
		/>
	);
}
