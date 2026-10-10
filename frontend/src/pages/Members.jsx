import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { 
  Users, UserPlus, Shield, ShieldCheck, User, Trash2, 
  Mail, Calendar, RefreshCw, AlertCircle, X, Check
} from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = (currentUser.role || "MEMBER").toUpperCase();
  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/memberships");
      setMembers(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách thành viên:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Gửi lời mời thành viên mới
  const handleInvite = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      await api.post("/memberships/invite", {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });
      setSuccessMsg(`Đã gửi lời mời thành công đến ${inviteEmail}!`);
      setInviteEmail("");
      setInviteModalOpen(false);
      fetchMembers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể gửi lời mời.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cập nhật vai trò thành viên
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/memberships/${userId}/role`, { role: newRole });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể cập nhật quyền.");
    }
  };

  // Xóa thành viên khỏi Workspace
  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${name}" khỏi Workspace?`)) return;
    try {
      await api.delete(`/memberships/${userId}`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa thành viên.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#38bdf8]" />
            Quản Lý Thành Viên
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Điều phối quyền truy cập và cộng tác trong không gian làm việc này
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMembers}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-[#94a3b8] hover:text-white transition-all"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canManage && (
            <button
              onClick={() => { setInviteModalOpen(true); setErrorMsg(""); setSuccessMsg(""); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Mời Thành Viên</span>
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO THÀNH CÔNG HOẶC THẤT BẠI */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400/60 hover:text-emerald-400">✕</button>
        </div>
      )}

      {/* DANH SÁCH THÀNH VIÊN */}
      <div className="bg-[#060b18]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#64748b] font-mono text-[10px] uppercase tracking-wider bg-white/[0.01]">
                <th className="py-3.5 px-4 font-semibold">Thành Viên</th>
                <th className="py-3.5 px-4 font-semibold">Vai Trò</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-semibold">Ngày Tham Gia</th>
                {canManage && <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748b]">
                    Đang tải danh sách thành viên...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748b]">
                    Chưa có thành viên nào trong Workspace này.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isSelf = m.userId === currentUser.id;
                  const isOwner = m.role === "OWNER";

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#38bdf8]/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {m.name ? m.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{m.name || "Chưa cập nhật tên"}</span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-[#94a3b8]">Bạn</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64748b] font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span>{m.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {canManage && !isOwner && !isSelf ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                            className="bg-[#020617] border border-white/10 rounded-lg px-2 py-1 text-xs text-[#38bdf8] font-mono outline-none cursor-pointer focus:border-[#38bdf8]"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                            isOwner 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                              : m.role === "ADMIN"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-white/5 text-[#94a3b8] border border-white/10"
                          }`}>
                            {isOwner ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {m.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                        <span className="text-emerald-400">{m.status}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748b]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("vi-VN") : "---"}</span>
                        </div>
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          {!isOwner && !isSelf && (
                            <button
                              onClick={() => handleRemove(m.userId, m.name || m.email)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Xóa thành viên"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MỜI THÀNH VIÊN */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#38bdf8]" />
                Mời Thành Viên Mới
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">
                  Địa Chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="dongnghiep@congty.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
                />
                <span className="text-[10px] text-[#64748b] mt-1 block">
                  * Tài khoản phải đã đăng ký trên hệ thống VERDIO trước khi nhận lời mời.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">
                  Vai Trò Trong Workspace
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                >
                  <option value="MEMBER">MEMBER — Chỉ có quyền xem và thao tác thông thường</option>
                  <option value="ADMIN">ADMIN — Quản trị viên, có quyền chỉnh sửa và mời thêm người</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {submitting ? "Đang gửi..." : "Gửi Lời Mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}