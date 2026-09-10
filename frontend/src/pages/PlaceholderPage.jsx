import React from "react";
import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }) {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/30 flex items-center justify-center text-[#38bdf8]">
        <Construction className="w-7 h-7 animate-pulse" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        <p className="text-xs text-[#94a3b8] font-mono mt-1">Route: {location.pathname}</p>
      </div>
      <p className="text-sm text-[#64748b] max-width-md">
        Mô-đun đang trong lộ trình phát triển tiếp theo theo kế hoạch.
      </p>
    </div>
  );
}