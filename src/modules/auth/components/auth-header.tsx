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
    <div className="relative w-full h-[240px] sm:h-[280px] overflow-hidden select-none">
      {/* Background Gradient & Geometric Pattern Overlay Container */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f2732] to-[#2f3c4b]">
        {/* SVG Geometric Tile Pattern Overlay matching _HeaderPatternPainter */}
        <svg
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 400 300"
        >
          <circle cx="40" cy="60" r="80" fill="white" fillOpacity="0.03" />
          <circle cx="320" cy="150" r="110" fill="white" fillOpacity="0.03" />
          <polygon
            points="120,0 240,300 260,300 140,0"
            fill="white"
            fillOpacity="0.024"
          />
        </svg>

        {/* SVG Curved Clip Path matching Flutter _HeaderClipper */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg
            className="relative block w-full h-[60px] sm:h-[75px]"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* White inverse fill at bottom to crop dark header in curve */}
            <path
              d="M 0 76 C 15 76, 22 98, 100 98 L 100 100 L 0 100 Z"
              className="fill-white dark:fill-zinc-950"
            />
          </svg>
        </div>
      </div>

      {/* Optional Top Left Back Button */}
      {backHref && (
        <div className="absolute top-6 left-6 z-20">
          <Link
            href={backHref}
            className="flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-200"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      )}

      {/* Header Content: Centered Title or Logo Card */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pb-8">
        {showLogoCard && (
          <div className="w-[76px] h-[76px] bg-white dark:bg-zinc-900 rounded-[20px] shadow-[0_8px_16px_rgba(0,0,0,0.12)] p-3 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <div className="w-full h-full bg-[#1f2732] rounded-[12px] flex items-center justify-center text-white">
              {logoIcon || <Kanban className="size-8 text-white" />}
            </div>
          </div>
        )}

        {title && (
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-[-1px]">
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
