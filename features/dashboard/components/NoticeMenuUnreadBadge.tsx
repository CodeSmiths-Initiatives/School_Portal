"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppNotificationListPayload } from "@/lib/services/notification.service";

export function NoticeMenuUnreadBadge() {
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		let isMounted = true;

		async function loadUnreadCount() {
			const response = await fetch("/api/notifications?readState=unread&pageSize=1", {
				cache: "no-store",
			}).catch(() => null);

			if (!response?.ok) return;

			const payload = (await response.json().catch(() => null)) as
				| AppNotificationListPayload
				| null;

			if (isMounted && payload?.meta) {
				setUnreadCount(payload.meta.unread);
			}
		}

		void loadUnreadCount();

		return () => {
			isMounted = false;
		};
	}, []);

	const countLabel = useMemo(
		() => (unreadCount > 99 ? "99+" : String(unreadCount)),
		[unreadCount],
	);

	if (!unreadCount) return null;

	return (
		<span className="ml-auto flex min-w-6 items-center justify-center rounded-full bg-[#E4A11B] px-2 py-0.5 text-[10px] font-black text-[#0D2B55] shadow-sm">
			{countLabel}
		</span>
	);
}
