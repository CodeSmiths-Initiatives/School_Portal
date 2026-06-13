"use client";

import { EllipsisVertical } from "lucide-react";
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type RowActionMenuItem = {
	label: string;
	icon: ReactNode;
	onSelect: () => void;
	disabled?: boolean;
	className?: string;
};

type MenuPosition = {
	top: number;
	left: number;
};

type RowActionMenuProps = {
	label: string;
	open: boolean;
	items: RowActionMenuItem[];
	onOpenChange: (open: boolean) => void;
	buttonClassName?: string;
	menuClassName?: string;
	width?: number;
};

const VIEWPORT_GAP = 8;
const ITEM_HEIGHT = 42;
const MENU_VERTICAL_PADDING = 16;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function RowActionMenu({
	label,
	open,
	items,
	onOpenChange,
	buttonClassName,
	menuClassName,
	width = 192,
}: RowActionMenuProps) {
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState<MenuPosition | null>(null);

	useLayoutEffect(() => {
		if (!open || !buttonRef.current) {
			setPosition(null);
			return;
		}

		const buttonRect = buttonRef.current.getBoundingClientRect();
		const menuHeight =
			menuRef.current?.getBoundingClientRect().height ??
			items.length * ITEM_HEIGHT + MENU_VERTICAL_PADDING;
		const spaceBelow = window.innerHeight - buttonRect.bottom;
		const shouldOpenUp =
			spaceBelow < menuHeight + VIEWPORT_GAP &&
			buttonRect.top > spaceBelow;
		const top = shouldOpenUp
			? buttonRect.top - menuHeight - VIEWPORT_GAP
			: buttonRect.bottom + VIEWPORT_GAP;

		setPosition({
			top: clamp(top, VIEWPORT_GAP, window.innerHeight - menuHeight - VIEWPORT_GAP),
			left: clamp(
				buttonRect.right - width,
				VIEWPORT_GAP,
				window.innerWidth - width - VIEWPORT_GAP,
			),
		});
	}, [items.length, open, width]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function closeMenu() {
			onOpenChange(false);
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node;

			if (
				buttonRef.current?.contains(target) ||
				menuRef.current?.contains(target)
			) {
				return;
			}

			closeMenu();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeMenu();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", closeMenu);
		window.addEventListener("scroll", closeMenu, true);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", closeMenu);
			window.removeEventListener("scroll", closeMenu, true);
		};
	}, [onOpenChange, open]);

	return (
		<div className="flex justify-end">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => onOpenChange(!open)}
				className={cn(
					"inline-flex size-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]",
					buttonClassName,
				)}
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				title="Actions"
			>
				<EllipsisVertical className="size-4" />
			</button>
			{open && typeof document !== "undefined"
				? createPortal(
						<div
							ref={menuRef}
							role="menu"
							style={{
								position: "fixed",
								top: position?.top ?? -9999,
								left: position?.left ?? -9999,
								width,
							}}
							className={cn(
								"z-[70] overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white py-2 text-sm font-bold text-[#0D2B55] shadow-[0_18px_45px_rgba(13,43,85,0.16)]",
								menuClassName,
							)}
						>
							{items.map((item) => (
								<button
									key={item.label}
									type="button"
									role="menuitem"
									disabled={item.disabled}
									onClick={() => {
										onOpenChange(false);
										item.onSelect();
									}}
									className={cn(
										"flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50",
										item.className,
									)}
								>
									{item.icon}
									{item.label}
								</button>
							))}
						</div>,
						document.body,
					)
				: null}
		</div>
	);
}
