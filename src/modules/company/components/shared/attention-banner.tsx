"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

export interface AttentionBannerAction {
  label: string;
  href: string;
}

interface AttentionBannerProps {
  title: string;
  description: string;
  actions?: AttentionBannerAction[];
}

export function AttentionBanner({
  title,
  description,
  actions = [],
}: AttentionBannerProps) {
  return (
    <div className="bg-warning rounded-[12px] p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="size-8 shrink-0 flex items-center justify-center text-warning-foreground">
          <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold leading-[20px] text-warning-foreground">
            {title}
          </p>
          <p className="text-[13px] leading-[18px] text-warning-foreground/90">
            {description}
          </p>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="h-[44px] px-3 rounded-[8px] bg-card border border-control-border text-[14px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
