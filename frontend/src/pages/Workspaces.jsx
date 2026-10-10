import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Building2, Shield, ArrowRight, PlusCircle, CheckCircle2 } from "lucide-react";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const currentWorkspaceId = localStorage.getItem("workspaceId");

  useEffect(() => {
    const fetchMyWorkspaces = async () => {
      try {
        const res = await api.get("/workspaces/my-workspaces");
        setWorkspaces(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách workspace:", err);
        setErrorMsg(err.response?.data?.message || "Không thể tải danh sách không gian làm việc.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyWorkspaces();
  }, []);

  const handleSwitchWorkspace = (tenantId, tenantName) => {
    localStorage.setItem("workspaceId", tenantId);
    localStorage.setItem("workspaceName", tenantName);
    window.dispatchEvent(new Event("tenant_updated"));
    navigate("/dashboard");
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 animate-in fade-in duration-300 text-white font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#38bdf8]" />
            Không Gian Làm Việc (Workspaces) Của Tôi
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Danh sách các tổ chức và dự án đa thuê bao (Multi-tenant) mà tài khoản của bạn đang tham gia
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#64748b] py-12 text-center">Đang tải danh sách không gian làm việc...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((ws) => {
            const wsId = ws.tenantId || ws._id;
            const isActive = wsId === currentWorkspaceId;
            return (
              <div
                key={wsId}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-[#6366f1]/15 border-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                    : "bg-[#0b1329]/70 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#38bdf8] flex items-center justify-center font-bold text-white text-sm">
                      {ws.name ? ws.name.charAt(0).toUpperCase() : "W"}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      ws.role === "OWNER" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white"
                    }`}>
                      {ws.role || "MEMBER"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{ws.name}</h3>
                  <p className="text-xs font-mono text-[#94a3b8]">Slug: {ws.slug || "N/A"}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Đang hoạt động
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchWorkspace(wsId, ws.name)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Truy cập</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}