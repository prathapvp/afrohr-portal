import { useEffect, useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";
import { Input } from "../../components/ui/input";
import {
  type EmployerMember,
  type EmployerRole,
  getEmployerMembers,
  linkEmployerMember,
  sendEmployerInviteOtp,
  updateEmployerMemberRole,
} from "../../services/user-service";
import { Users, Crown, Briefcase, Eye, UserPlus, Send, Shield, RefreshCw } from "lucide-react";

const ROLE_OPTIONS: EmployerRole[] = ["OWNER", "RECRUITER", "VIEWER"];

function getRoleMeta(role: EmployerRole | undefined) {
  if (role === "OWNER")     return { pill: "border-emerald-400/35 bg-emerald-500/15 text-emerald-200", border: "border-l-emerald-400", icon: Crown };
  if (role === "RECRUITER") return { pill: "border-cyan-400/35 bg-cyan-500/15 text-cyan-200",         border: "border-l-cyan-400",    icon: Briefcase };
  return                           { pill: "border-slate-400/35 bg-slate-500/15 text-slate-300",       border: "border-l-slate-500",   icon: Eye };
}

function getInitials(name: string | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function AvatarCircle({ name, role }: { name?: string; role?: EmployerRole }) {
  const colors =
    role === "OWNER"     ? "from-emerald-500 to-teal-600" :
    role === "RECRUITER" ? "from-cyan-500 to-blue-600"    :
                           "from-slate-500 to-slate-600";
  return (
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors} text-sm font-bold text-white shadow-md`}>
      {getInitials(name)}
    </div>
  );
}

export default function EmployerTeamAccessPage() {
  const [members, setMembers] = useState<EmployerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<EmployerRole>("RECRUITER");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [roleUpdateBusyId, setRoleUpdateBusyId] = useState<number | null>(null);
  const [otpBusyEmail, setOtpBusyEmail] = useState<string | null>(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as { id?: number; employerRole?: EmployerRole }) : null;
    } catch {
      return null;
    }
  }, []);

  const currentUserId = currentUser?.id ?? null;
  const currentUserRole = (currentUser?.employerRole ?? "").toUpperCase() as EmployerRole | "";
  const isOwner = currentUserRole === "OWNER";

  async function loadMembers() {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployerMembers();
      setMembers(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load team members.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  const ownerCount = members.filter((m) => m.employerRole === "OWNER").length;
  const recruiterCount = members.filter((m) => m.employerRole === "RECRUITER").length;
  const viewerCount = members.filter((m) => m.employerRole === "VIEWER" || !m.employerRole).length;

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) { setError("Enter an email address to invite."); return; }
    try {
      setInviteBusy(true);
      setError(null);
      const linkedMember = await linkEmployerMember(email);
      await sendEmployerInviteOtp(linkedMember.email);
      setInviteEmail("");
      await loadMembers();
      notifications.show({ color: "green", title: "Member added & OTP sent", message: `${linkedMember.email} can now verify OTP and set a password.` });
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : "Unable to invite member.";
      setError(message);
      notifications.show({ color: "red", title: "Invite failed", message });
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleSendOtp(email: string) {
    try {
      setOtpBusyEmail(email);
      setError(null);
      await sendEmployerInviteOtp(email);
      notifications.show({ color: "green", title: "OTP sent", message: `An OTP was sent to ${email}.` });
    } catch (otpError) {
      const message = otpError instanceof Error ? otpError.message : "Unable to send OTP.";
      setError(message);
      notifications.show({ color: "red", title: "OTP send failed", message });
    } finally {
      setOtpBusyEmail(null);
    }
  }

  async function handleRoleChange(memberId: number, role: EmployerRole) {
    try {
      setRoleUpdateBusyId(memberId);
      setError(null);
      const updated = await updateEmployerMemberRole(memberId, role);
      setMembers((prev) => prev.map((item) => (item.id === memberId ? updated : item)));
      notifications.show({ color: "green", title: "Role updated", message: `${updated.name} is now ${updated.employerRole ?? role}.` });
    } catch (roleError) {
      const message = roleError instanceof Error ? roleError.message : "Unable to update role.";
      setError(message);
      notifications.show({ color: "red", title: "Role update failed", message });
    } finally {
      setRoleUpdateBusyId(null);
    }
  }

  return (
    <div className="space-y-4 px-4 py-5 sm:px-6">

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d2236] via-[#0f2b42] to-[#122033] px-6 py-5 shadow-[0_18px_60px_rgba(2,10,24,0.5)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
            <Shield className="h-3 w-3" />
            Access Control
          </div>
          <h1 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">Team Access</h1>
          <p className="mt-1 text-sm text-slate-400">Manage who can access this employer workspace and what they can do.</p>
        </div>

        {/* Stat tiles */}
        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total",      value: members.length,  icon: Users,     color: "text-white" },
            { label: "Owners",     value: ownerCount,       icon: Crown,     color: "text-emerald-300" },
            { label: "Recruiters", value: recruiterCount,   icon: Briefcase, color: "text-cyan-300" },
            { label: "Viewers",    value: viewerCount,      icon: Eye,       color: "text-slate-300" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
              <div>
                <div className={`text-lg font-black leading-none ${color}`}>{loading ? "—" : value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Invite form ────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <UserPlus className="h-4 w-4 text-violet-300" />
          Invite New Member
        </div>

        {!isOwner ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <Shield className="h-4 w-4 flex-shrink-0 text-amber-300" />
            Only the workspace OWNER can add members or change roles.
          </div>
        ) : (
          <>
            {/* Role picker */}
            <div className="mb-3 flex gap-1.5">
              {ROLE_OPTIONS.map((role) => {
                const { pill } = getRoleMeta(role);
                return (
                  <button
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${inviteRole === role ? pill : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"}`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                disabled={inviteBusy}
                className="h-10 flex-1 rounded-xl border-white/20 bg-white/[0.08] text-sm text-white placeholder:text-slate-400 focus:bg-white/[0.12]"
              />
              <button
                onClick={handleInvite}
                disabled={inviteBusy || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteBusy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {inviteBusy ? "Adding…" : "Add Member"}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
        )}
      </div>

      {/* ── Members list ───────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Users className="h-4 w-4 text-cyan-300" />
            Workspace Members
          </div>
          <button
            onClick={loadMembers}
            disabled={loading}
            title="Refresh"
            className="rounded-lg border border-white/10 bg-white/[0.05] p-1.5 text-slate-400 transition-colors hover:bg-white/[0.10] hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No members yet</p>
            <p className="mt-1 text-xs text-slate-500">Invite a colleague above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const memberRole = (member.employerRole ?? "RECRUITER") as EmployerRole;
              const { pill, border, icon: RoleIcon } = getRoleMeta(memberRole);
              const isSelf = currentUserId !== null && member.id === currentUserId;
              const isLastOwner = memberRole === "OWNER" && ownerCount <= 1;
              const disableRoleChange = !isOwner || isSelf || isLastOwner || roleUpdateBusyId === member.id;

              return (
                <div
                  key={member.id}
                  className={`flex flex-col gap-3 rounded-xl border border-white/10 border-l-2 ${border} bg-white/[0.03] p-3.5 sm:flex-row sm:items-center sm:justify-between ${isSelf ? "bg-violet-500/[0.04]" : ""}`}
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-3">
                    <AvatarCircle name={member.name} role={memberRole} />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-100">{member.name ?? "—"}</span>
                        {isSelf && (
                          <span className="rounded-md border border-amber-400/30 bg-amber-500/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-amber-200">You</span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${pill}`}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {memberRole}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Role pill-button group */}
                    <div className={`flex gap-1 rounded-xl border border-white/10 bg-white/[0.05] p-1 ${disableRoleChange ? "opacity-50 pointer-events-none" : ""}`}>
                      {ROLE_OPTIONS.map((role) => {
                        const { pill: rPill } = getRoleMeta(role);
                        return (
                          <button
                            key={role}
                            disabled={disableRoleChange || roleUpdateBusyId === member.id}
                            onClick={() => handleRoleChange(member.id, role)}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${memberRole === role ? rPill + " border" : "text-slate-500 hover:text-slate-200"}`}
                          >
                            {roleUpdateBusyId === member.id && memberRole !== role ? "…" : role}
                          </button>
                        );
                      })}
                    </div>

                    {/* Send OTP */}
                    <button
                      disabled={!isOwner || otpBusyEmail === member.email}
                      onClick={() => handleSendOtp(member.email)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpBusyEmail === member.email ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      {otpBusyEmail === member.email ? "Sending…" : "Send OTP"}
                    </button>
                  </div>
                </div>
              );
            })}

            {ownerCount <= 1 && (
              <p className="mt-1 rounded-lg border border-amber-400/20 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-300">
                At least one OWNER must remain. Promote another member before demoting the last OWNER.
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
