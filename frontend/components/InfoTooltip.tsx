"use client";

import { useId, useState } from "react";

type InfoTooltipProps = {
  label: string;
  content: string;
  className?: string;
};

export function InfoTooltip({ label, content, className = "" }: InfoTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={`absolute right-4 top-4 z-20 ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tooltipId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={`text-slate-700 transition-all duration-200 ease-out hover:scale-110 hover:text-slate-900 active:scale-95 ${open ? "text-slate-900" : ""}`}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="block h-5 w-5" aria-hidden="true">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="block h-5 w-5" aria-hidden="true">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
          </svg>
        )}
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute right-0 top-8 w-72 origin-top-right rounded-xl border border-slate-200 bg-slate-950 px-3 py-2 text-left text-xs leading-5 text-slate-100 shadow-2xl transition-all duration-200 ease-out ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {content}
      </div>
    </div>
  );
}