"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Kanban } from "lucide-react";

interface AuthHeaderProps {
  /**
   * Title shown inside header (e.g. "Sign Up" or logo card if omitted)
   */
  title?: string;
  /**
   * Show back button leading to target URL
   */
  backHref?: string;
  /**
   * Show centered logo card (used in Login screen)
   */
  showLogoCard?: boolean;
  /**
   * Optional custom logo icon or child element inside card
   */
  logoIcon?: ReactNode;
}

export function AuthHeader({
  title,
  backHref,
  showLogoCard = false,
  logoIcon,
}: AuthHeaderProps) {
  return (
    <div className="relative w-full h-[220px] sm:h-[280px] lg:h-[320px] overflow-hidden select-none shrink-0">
      {/* Background Gradient & Geometric Pattern Overlay Container */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f2732] via-[#242f3d] to-[#2f3c4b]">
        {/* SVG Geometric Tile Pattern Overlay matching Flutter _HeaderPatternPainter */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1200 400"
        >
          <circle cx="120" cy="100" r="180" fill="white" fillOpacity="0.03" />
          <circle cx="1080" cy="220" r="240" fill="white" fillOpacity="0.03" />
          <polygon
            points="360,0 720,400 780,400 420,0"
            fill="white"
            fillOpacity="0.024"
          />
          <polygon
            points="800,0 1000,400 1040,400 840,0"
            fill="white"
            fillOpacity="0.018"
          />
        </svg>

        {/* SVG Curved Clip Path matching Flutter _HeaderClipper */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
          <svg
            className="relative block w-full h-[55px] sm:h-[70px] lg:h-[85px]"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            {/* Soft background fill: pure white on mobile for 100% Flutter fidelity, soft tint on desktop */}
            <path
              d="M 0 76 C 150 76, 220 98, 1000 98 L 1000 100 L 0 100 Z"
              className="fill-white sm:fill-[#f8fafc] dark:fill-zinc-950"
            />
          </svg>
        </div>
      </div>

      {/* Top Left Back Button (Higher z-index & explicit pointer-events-auto) */}
      {backHref && (
        <div className="absolute top-6 left-6 sm:left-10 z-30 pointer-events-auto">
          <Link
            href={backHref}
            className="flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-white transition-all duration-200 shadow-sm cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      )}

      {/* Header Content: Centered Title or Logo Card (pointer-events-none so it doesn't block back button clicks) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pb-10 sm:pb-14 pointer-events-none">
        {showLogoCard && (
          <div className="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] bg-white dark:bg-zinc-900 rounded-[20px] sm:rounded-[26px] shadow-[0_12px_28px_rgba(0,0,0,0.18)] p-3 flex items-center justify-center transition-transform hover:scale-105 duration-300 border border-white/20 pointer-events-auto">
            <div className="w-full h-full bg-[#1f2732] rounded-[12px] sm:rounded-[18px] flex items-center justify-center text-white shadow-inner">
              {logoIcon || <Kanban className="size-8 sm:size-10 text-white" />}
            </div>
          </div>
        )}

        {title && (
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-1px] text-center drop-shadow-sm pointer-events-auto">
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
