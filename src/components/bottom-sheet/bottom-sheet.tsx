"use client";

import { clsx } from "clsx";
import { Dialog } from "radix-ui";
import {
	type CSSProperties,
	createContext,
	type JSX,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import css from "./bottom-sheet.module.css";

/**
 * Nesting link between a sheet and any sheet opened from within it: the child
 * reports its open state so the parent can quiet its own overlay, and inherits a
 * deeper stacking level so it renders above the parent.
 */
interface BottomSheetNesting {
	depth: number;
	onNestedOpenChange: (open: boolean) => void;
}

const BottomSheetContext = createContext<BottomSheetNesting>({
	depth: 0,
	onNestedOpenChange: () => {},
});

/**
 * Props for {@link BottomSheet}.
 */
interface BottomSheetProps {
	/**
	 * Controlled open state.
	 */
	open: boolean;
	/**
	 * Requested open/close (Escape, backdrop, drag-to-dismiss, or a close button).
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * The sheet's accessible title, shown next to the grab handle.
	 */
	title: ReactNode;
	/**
	 * Optional hint rendered under the title (wires the dialog's description).
	 */
	description?: ReactNode;
	children: ReactNode;
	"data-testid"?: string;
	/**
	 * Called once the close (exit) animation has finished, so a parent that mounts
	 * the sheet conditionally can unmount only after it has animated out.
	 */
	onCloseComplete?: () => void;
}

/**
 * A modal bottom sheet: a Radix dialog anchored to the bottom edge at every
 * width, with a grab handle that can be dragged down to dismiss (past ~a third
 * of its height; otherwise it springs back). Escape and the backdrop remain the
 * keyboard/click dismissal paths. Shared by the composer, the reveal picker, the
 * move-log filter, and the move editor so they read as one surface.
 *
 * Sheets nest: a sheet opened from within another (e.g. the Fail reveal over the
 * composer) stacks one level deeper, and the sheet beneath it stops dimming so
 * the topmost overlay darkens and blurs the whole stack uniformly — the
 * under-sheet reads as background, just like the app behind it.
 */
export function BottomSheet({
	open,
	onOpenChange,
	title,
	description,
	children,
	"data-testid": dataTestId,
	onCloseComplete,
}: BottomSheetProps): JSX.Element {
	const { depth, onNestedOpenChange: notifyParent } =
		useContext(BottomSheetContext);

	// whether a sheet opened from within this one is currently up. While it is,
	// this sheet's overlay stops dimming so only the topmost overlay dims the
	// stack (no double-darkening of the app background beneath).
	const [nestedOpen, setNestedOpen] = useState(false);

	// tell the parent sheet (if any) whether this one is open, so it can quiet its
	// overlay while we sit on top of it.
	useEffect(() => {
		if (!open) return;
		notifyParent(true);
		return () => notifyParent(false);
	}, [open, notifyParent]);

	const nesting = useMemo<BottomSheetNesting>(
		() => ({ depth: depth + 1, onNestedOpenChange: setNestedOpen }),
		[depth],
	);

	// sheet drag state lives in refs and is written straight to the DOM (a CSS
	// custom property) so dragging never re-renders the sheet body under the finger.
	const contentRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		startY: number;
		pointerId: number;
		height: number;
	} | null>(null);

	const setDragOffset = (px: number) => {
		contentRef.current?.style.setProperty("--sheet-drag-y", `${px}px`);
	};

	/**
	 * Begin a drag from the handle; suspend the snap-back transition so the sheet
	 * tracks the finger 1:1.
	 */
	const handleDragStart = (event: React.PointerEvent) => {
		const content = contentRef.current;
		if (!content) return;
		// on wide viewports the sheet is a centered dialog (no handle, no drag);
		// the container query keys off body width, which tracks the viewport.
		if (window.matchMedia?.("(min-width: 30rem)")?.matches) return;
		dragRef.current = {
			startY: event.clientY,
			pointerId: event.pointerId,
			height: content.offsetHeight,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		content.style.transition = "none";
	};

	const handleDragMove = (event: React.PointerEvent) => {
		const drag = dragRef.current;
		if (!drag || event.pointerId !== drag.pointerId) return;
		// only downward travel moves the sheet.
		setDragOffset(Math.max(0, event.clientY - drag.startY));
	};

	/**
	 * Release: dismiss past ~a third of the sheet height (capped so a tall sheet
	 * still closes on a firm drag), otherwise spring back to rest.
	 */
	const handleDragEnd = (event: React.PointerEvent) => {
		const drag = dragRef.current;
		const content = contentRef.current;
		if (!drag || !content || event.pointerId !== drag.pointerId) return;
		dragRef.current = null;
		const dragged = Math.max(0, event.clientY - drag.startY);
		// restore the transition so the snap-back animates (and the next drag is
		// re-armed); on dismiss, the exit keyframe reads the offset we leave behind.
		content.style.transition = "";
		if (dragged > Math.min(drag.height * 0.35, 200)) {
			onOpenChange(false);
		} else {
			setDragOffset(0);
		}
	};

	/**
	 * Pointer cancel (e.g. an interrupted gesture): spring back, never dismiss.
	 */
	const handleDragCancel = () => {
		if (!dragRef.current) return;
		dragRef.current = null;
		if (contentRef.current) contentRef.current.style.transition = "";
		setDragOffset(0);
	};

	// deeper sheets sit above shallower ones; the exact z-indices are 40/50 at
	// depth 0, 60/70 at depth 1, and so on (see the module's calc()).
	const depthStyle = { "--sheet-depth": depth } as CSSProperties;

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay
					className={clsx(css.overlay, nestedOpen && css.quiet)}
					style={depthStyle}
				/>
				<Dialog.Content
					ref={contentRef}
					className={css.content}
					style={depthStyle}
					data-testid={dataTestId}
					data-sheet-nested={nestedOpen ? "true" : undefined}
					// with a description we let Radix wire aria-describedby to it;
					// without one, silence the "missing description" warning.
					{...(description == null ? { "aria-describedby": undefined } : {})}
					onAnimationEnd={(event) => {
						// fire only on this content's own exit animation (not enter, and
						// not a bubbled child animation). jsdom fires no CSS animations, so
						// the close path is e2e-covered.
						/* v8 ignore next */
						if (!open && event.target === event.currentTarget)
							onCloseComplete?.();
					}}
				>
					{/* Grab handle + title form the drag region. Pointer drag is a
					    progressive enhancement; Escape and the overlay stay the
					    keyboard/click dismissal paths. */}
					<div
						className={css.grabber}
						onPointerDown={handleDragStart}
						onPointerMove={handleDragMove}
						onPointerUp={handleDragEnd}
						onPointerCancel={handleDragCancel}
						data-testid="sheet-handle"
					>
						<span className={css.handle} aria-hidden />
						<Dialog.Title className={css.title}>{title}</Dialog.Title>
					</div>
					{description != null && (
						<Dialog.Description className={css.hint}>
							{description}
						</Dialog.Description>
					)}
					<BottomSheetContext.Provider value={nesting}>
						{children}
					</BottomSheetContext.Provider>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
