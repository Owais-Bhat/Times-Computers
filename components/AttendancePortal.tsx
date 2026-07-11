"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

type PillStyle = { bg: string; color: string };
type Notice = { id: number; title: string; body: string; priority: string; date: string };
type Leave = { id: number; name: string; dept: string; type: string; range: string; reason: string; status: string };
type DbUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  department: string;
  jobTitle: string;
  branch: string;
  employeeCode: string | null;
  createdAt: string;
};
type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
  lateMinutes: number;
  totalWorkingHours: number | null;
  breakMinutes: number | null;
  branch: string | null;
  remarks: string | null;
  batchAssigned: string | null;
  classesTaken: number | null;
  studentsPresent: number | null;
  studentsAbsent: number | null;
};
type AdminAttendanceRecord = AttendanceRecord & {
  user: { id: string; name: string; department: string; jobTitle: string; branch: string; employeeCode: string | null };
};

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.78)",
  borderRadius: "24px",
  boxShadow: "0 12px 40px rgba(109,90,230,0.12)",
};

const inputStyle: CSSProperties = {
  padding: "13px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(109,90,230,0.18)",
  background: "rgba(255,255,255,0.7)",
  fontSize: "14px",
  color: "#57506e",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const primaryBtn: CSSProperties = {
  padding: "15px",
  border: "none",
  borderRadius: "16px",
  background: "linear-gradient(135deg,#6d5ae6,#8b74f0)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(109,90,230,0.35)",
};

const smallInput: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(109,90,230,0.18)",
  background: "rgba(255,255,255,0.7)",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const sora = "var(--font-sora), sans-serif";

function pill(status: string): PillStyle {
  if (status === "PRESENT" || status === "On time") return { bg: "rgba(31,169,122,0.14)", color: "#147a58" };
  if (status === "LATE" || status === "Late") return { bg: "rgba(232,145,45,0.16)", color: "#a8641a" };
  if (status === "ABSENT" || status === "Absent") return { bg: "rgba(226,85,123,0.13)", color: "#b13a60" };
  if (status === "LEAVE" || status === "Leave") return { bg: "rgba(42,143,219,0.13)", color: "#1f6dab" };
  if (status === "Approved") return { bg: "rgba(31,169,122,0.14)", color: "#147a58" };
  if (status === "Rejected") return { bg: "rgba(226,85,123,0.13)", color: "#b13a60" };
  if (status === "Pending") return { bg: "rgba(232,145,45,0.16)", color: "#a8641a" };
  return { bg: "rgba(109,90,230,0.12)", color: "#5a48c9" };
}
function prPill(p: string): PillStyle {
  if (p === "Urgent") return { bg: "rgba(226,85,123,0.13)", color: "#b13a60" };
  if (p === "Important") return { bg: "rgba(232,145,45,0.16)", color: "#a8641a" };
  return { bg: "rgba(109,90,230,0.12)", color: "#5a48c9" };
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function AttendancePortal() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("dash");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Real login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Real DB-backed user management (Employees tab, admin only)
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [neName, setNeName] = useState("");
  const [neEmail, setNeEmail] = useState("");
  const [nePassword, setNePassword] = useState("");
  const [neDept, setNeDept] = useState("");
  const [neJobTitle, setNeJobTitle] = useState("");
  const [neBranch, setNeBranch] = useState("");
  const [neCode, setNeCode] = useState("");
  const [neRoleField, setNeRoleField] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Real attendance state
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [adminToday, setAdminToday] = useState<AdminAttendanceRecord[]>([]);
  const [adminMonth, setAdminMonth] = useState<AdminAttendanceRecord[]>([]);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [coBatch, setCoBatch] = useState("");
  const [coClasses, setCoClasses] = useState("");
  const [coStudentsPresent, setCoStudentsPresent] = useState("");
  const [coStudentsAbsent, setCoStudentsAbsent] = useState("");
  const [coBreak, setCoBreak] = useState("");
  const [coRemarks, setCoRemarks] = useState("");
  const [checkOutError, setCheckOutError] = useState<string | null>(null);

  // Real settings
  const [stIP, setStIP] = useState("192.168.10.1");
  const [stShift, setStShift] = useState("09:00");
  const [stGrace, setStGrace] = useState(5);
  const [stCut, setStCut] = useState(3);
  const [saved, setSaved] = useState(false);
  // null = still checking; set from /api/network-status (same server-side
  // detection the check-in endpoint enforces)
  const [onOfficeNetwork, setOnOfficeNetwork] = useState<boolean | null>(null);
  const [detectedIP, setDetectedIP] = useState<string | null>(null);
  const [suggestedEntry, setSuggestedEntry] = useState<string | null>(null);

  // Monthly report filters
  const [repQuery, setRepQuery] = useState("");
  const [repDept, setRepDept] = useState("");

  const [now, setNow] = useState(new Date());

  // Notices / leave requests (kept as lightweight in-memory state — not part of the DB schema)
  const [notices, setNotices] = useState<Notice[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [lvType, setLvType] = useState("Casual leave");
  const [lvFrom, setLvFrom] = useState("");
  const [lvTo, setLvTo] = useState("");
  const [lvReason, setLvReason] = useState("");
  const [lvSent, setLvSent] = useState(false);
  const [ntTitle, setNtTitle] = useState("");
  const [ntBody, setNtBody] = useState("");
  const [ntPriority, setNtPriority] = useState("Normal");
  const [ntSent, setNtSent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load settings once a session exists (safe pattern: setState only inside the .then callback)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStIP(data.settings.officeIP);
        setStShift(data.settings.shiftStart);
        setStGrace(data.settings.graceMinutes);
        setStCut(data.settings.latesPerCut);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Live office-network status: check on login and every 30s after
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const check = () => {
      fetch("/api/network-status")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setOnOfficeNetwork(data.onNetwork);
          setDetectedIP(data.detectedIP);
          setSuggestedEntry(data.suggestedEntry ?? null);
        })
        .catch(() => {});
    };
    check();
    const t = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [session]);

  // Load my attendance once logged in as an employee
  useEffect(() => {
    if (session?.user?.role !== "EMPLOYEE") return;
    let cancelled = false;
    fetch("/api/attendance/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setMyRecords(data.records);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.role]);

  // Load admin attendance data once logged in as admin
  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/attendance?scope=today").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/attendance?scope=month").then((r) => (r.ok ? r.json() : null)),
    ]).then(([today, month]) => {
      if (cancelled) return;
      if (today) setAdminToday(today.records);
      if (month) setAdminMonth(month.records);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.role]);

  function goToUsersTab() {
    setTab("emp");
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDbUsers(data.users);
      })
      .finally(() => setUsersLoading(false));
  }

  async function refreshAdminAttendance() {
    const [today, month] = await Promise.all([
      fetch("/api/admin/attendance?scope=today").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/attendance?scope=month").then((r) => (r.ok ? r.json() : null)),
    ]);
    if (today) setAdminToday(today.records);
    if (month) setAdminMonth(month.records);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier: loginIdentifier,
        password: loginPassword,
        redirect: false,
      });
      if (!res || res.error) {
        setLoginError("Invalid email or password.");
      } else {
        setLoginPassword("");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function createUser() {
    setCreateUserError(null);
    if (!neName || !neEmail || !nePassword) {
      setCreateUserError("Name, email and password are required.");
      return;
    }
    setCreateUserLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: neName,
          email: neEmail,
          password: nePassword,
          role: neRoleField,
          department: neDept || "General",
          jobTitle: neJobTitle || "Staff",
          branch: neBranch || "Main Campus",
          employeeCode: neCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateUserError(data.error || "Failed to create user.");
        return;
      }
      setDbUsers((us) => [data.user, ...us]);
      setNeName("");
      setNeEmail("");
      setNePassword("");
      setNeDept("");
      setNeJobTitle("");
      setNeBranch("");
      setNeCode("");
      setNeRoleField("EMPLOYEE");
    } finally {
      setCreateUserLoading(false);
    }
  }

  async function removeUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDbUsers((us) => us.filter((u) => u.id !== id));
    }
  }

  async function doCheckIn() {
    setCheckInError(null);
    const res = await fetch("/api/attendance/check-in", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setCheckInError(data.error || "Check-in failed.");
      return;
    }
    setMyRecords((rs) => [data.attendance, ...rs.filter((r) => r.id !== data.attendance.id)]);
  }

  async function submitCheckout() {
    setCheckOutError(null);
    const res = await fetch("/api/attendance/check-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchAssigned: coBatch || undefined,
        classesTaken: coClasses ? Number(coClasses) : undefined,
        studentsPresent: coStudentsPresent ? Number(coStudentsPresent) : undefined,
        studentsAbsent: coStudentsAbsent ? Number(coStudentsAbsent) : undefined,
        breakMinutes: coBreak ? Number(coBreak) : undefined,
        remarks: coRemarks || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCheckOutError(data.error || "Check-out failed.");
      return;
    }
    setMyRecords((rs) => rs.map((r) => (r.id === data.attendance.id ? data.attendance : r)));
    setShowCheckoutForm(false);
    setCoBatch("");
    setCoClasses("");
    setCoStudentsPresent("");
    setCoStudentsAbsent("");
    setCoBreak("");
    setCoRemarks("");
  }

  function submitLeave() {
    const range = (lvFrom || "TBD") + (lvTo && lvTo !== lvFrom ? " – " + lvTo : "");
    setLeaves((ls) => [{ id: Date.now(), name: session?.user?.name ?? "Employee", dept: session?.user?.department ?? "General", type: lvType, range, reason: lvReason || "—", status: "Pending" }, ...ls]);
    setLvSent(true);
    setLvFrom("");
    setLvTo("");
    setLvReason("");
  }
  function sendNotice() {
    setNotices((ns) => [{ id: Date.now(), title: ntTitle || "Untitled notice", body: ntBody || "", priority: ntPriority, date: "Just now" }, ...ns]);
    setNtTitle("");
    setNtBody("");
    setNtSent(true);
  }
  async function saveSettings() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officeIP: stIP, shiftStart: stShift, graceMinutes: Number(stGrace), latesPerCut: Number(stCut) }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }
  function logout() {
    signOut({ redirect: false });
  }

  function fmtShift() {
    const [h, m] = stShift.split(":").map(Number);
    const hh = ((h + 11) % 12) + 1;
    return hh + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
  }
  function fmtLateAfter() {
    const [h, m] = stShift.split(":").map(Number);
    const total = h * 60 + m + Number(stGrace || 0);
    const hh2 = Math.floor(total / 60), mm2 = total % 60;
    const hh = ((hh2 + 11) % 12) + 1;
    return hh + ":" + String(mm2).padStart(2, "0") + " " + (hh2 < 12 ? "AM" : "PM");
  }

  const clock = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const todayDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const todayRecord = myRecords.find((r) => isToday(r.date));
  const checkedIn = !!todayRecord?.checkInAt;
  const checkedOut = !!todayRecord?.checkOutAt;
  const checkInLate = todayRecord?.status === "LATE";
  const myRecentLates = myRecords.filter((r) => r.status === "LATE").length;
  const cutNow = myRecentLates >= Number(stCut || 3);
  const lateDots = [0, 1, 2].map((i) => (i < myRecentLates ? { bg: "#e8912d", border: "#e8912d" } : { bg: "transparent", border: "rgba(232,145,45,0.45)" }));

  const myDays = myRecords.slice(0, 14).map((r) => {
    const p = pill(r.status);
    return {
      date: fmtDate(r.date) + (isToday(r.date) ? " (today)" : ""),
      in: fmtTime(r.checkInAt),
      out: fmtTime(r.checkOutAt),
      hours: r.totalWorkingHours != null ? r.totalWorkingHours + "h" : "—",
      status: r.status,
      pillBg: p.bg,
      pillColor: p.color,
    };
  });

  const noticeItems = notices.map((n) => {
    const p = prPill(n.priority);
    return { ...n, prBg: p.bg, prColor: p.color, del: () => setNotices((ns) => ns.filter((x) => x.id !== n.id)) };
  });

  const tabs: [string, string][] = [["dash", "Dashboard"], ["emp", "Faculty accounts"], ["rep", "Monthly report"], ["not", "Notice board"], ["lea", "Leave requests"], ["set", "Settings"]];
  const navItems = tabs.map(([key, label]) => ({
    key,
    label,
    active: key === tab,
    go: key === "emp" ? goToUsersTab : () => setTab(key),
  }));

  const cntToday = (s: string) => adminToday.filter((r) => r.status === s).length;
  const presentToday = cntToday("PRESENT") + cntToday("LATE");
  const statCards = [
    { label: "PRESENT", value: presentToday, sub: "faculty checked in", color: "#147a58" },
    { label: "LATE TODAY", value: cntToday("LATE"), sub: "after " + fmtLateAfter(), color: "#a8641a" },
    { label: "ABSENT", value: cntToday("ABSENT"), sub: "no check-in", color: "#b13a60" },
    { label: "ON LEAVE", value: cntToday("LEAVE"), sub: "approved leaves", color: "#1f6dab" },
  ];
  const liveFeed = adminToday.filter((r) => r.checkInAt).map((r) => {
    const p = pill(r.status);
    return { name: r.user.name, dept: r.user.department, time: fmtTime(r.checkInAt), status: r.status, pillBg: p.bg, pillColor: p.color, initials: initials(r.user.name) };
  });

  const lateCountByUser = new Map<string, { name: string; dept: string; lates: number }>();
  adminMonth.forEach((r) => {
    if (r.status !== "LATE") return;
    const cur = lateCountByUser.get(r.userId) ?? { name: r.user.name, dept: r.user.department, lates: 0 };
    cur.lates += 1;
    lateCountByUser.set(r.userId, cur);
  });
  const atRisk = [...lateCountByUser.values()].filter((e) => e.lates >= 2).sort((a, b) => b.lates - a.lates).slice(0, 6).map((e) => {
    const cut = e.lates >= Number(stCut || 3);
    return {
      name: e.name, dept: e.dept, lates: e.lates,
      note: cut ? Math.floor(e.lates / Number(stCut || 3)) + " day cut" : "more lates = day cut",
      color: cut ? "#b13a60" : "#a8641a",
      bg: cut ? "rgba(226,85,123,0.08)" : "rgba(232,145,45,0.08)",
      border: cut ? "rgba(226,85,123,0.22)" : "rgba(232,145,45,0.22)",
    };
  });

  const reportByUser = new Map<string, { name: string; dept: string; present: number; late: number; absent: number; leave: number; hours: number }>();
  adminMonth.forEach((r) => {
    const cur = reportByUser.get(r.userId) ?? { name: r.user.name, dept: r.user.department, present: 0, late: 0, absent: 0, leave: 0, hours: 0 };
    if (r.status === "PRESENT") cur.present += 1;
    if (r.status === "LATE") { cur.late += 1; cur.present += 1; }
    if (r.status === "ABSENT") cur.absent += 1;
    if (r.status === "LEAVE") cur.leave += 1;
    cur.hours += r.totalWorkingHours ?? 0;
    reportByUser.set(r.userId, cur);
  });
  const reportRows = [...reportByUser.values()].map((r) => {
    const c = Math.floor(r.late / Number(stCut || 3));
    return {
      name: r.name, dept: r.dept, present: r.present, late: r.late, absent: r.absent, leave: r.leave,
      hours: Math.round(r.hours * 10) / 10,
      lateColor: r.late >= 3 ? "#b13a60" : r.late >= 2 ? "#a8641a" : "#57506e",
      cut: c > 0 ? "−" + c + " day" : "—", cutColor: c > 0 ? "#b13a60" : "#a29dbb",
      rowBg: c > 0 ? "rgba(226,85,123,0.05)" : "transparent",
    };
  });
  const totalLates = [...reportByUser.values()].reduce((a, e) => a + e.late, 0);
  const totalCuts = [...reportByUser.values()].reduce((a, e) => a + Math.floor(e.late / Number(stCut || 3)), 0);
  const reportDepts = [...new Set(reportRows.map((r) => r.dept))].sort();
  const filteredReportRows = reportRows.filter(
    (r) => (!repDept || r.dept === repDept) && (!repQuery || r.name.toLowerCase().includes(repQuery.toLowerCase()))
  );

  const leaveRows = leaves.map((l) => {
    const p = pill(l.status);
    return {
      ...l, initials: initials(l.name), avBg: "linear-gradient(135deg,#6d5ae6,#a78bfa)",
      pending: l.status === "Pending", decided: l.status !== "Pending", stBg: p.bg, stColor: p.color,
      approve: () => setLeaves((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "Approved" } : x))),
      reject: () => setLeaves((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "Rejected" } : x))),
    };
  });

  const myLeaves = leaves.filter((l) => l.name === (session?.user?.name ?? "")).map((l) => {
    const p = pill(l.status);
    return { type: l.type, range: l.range, status: l.status, stBg: p.bg, stColor: p.color };
  });

  const inPill = checkInLate ? pill("LATE") : pill("PRESENT");
  const netChip =
    onOfficeNetwork === null
      ? { bg: "rgba(109,90,230,0.10)", color: "#6f6a85", label: "Checking network…" }
      : onOfficeNetwork
        ? { bg: "rgba(31,169,122,0.14)", color: "#147a58", label: "Office network" }
        : { bg: "rgba(226,85,123,0.13)", color: "#b13a60", label: "Not in office" };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 16, color: "#6f6a85" }}>Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rp-center-pad" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, boxSizing: "border-box" }}>
        <div className="rp-login-card" style={{ ...glass, width: 440, padding: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "fadeUp .5s ease" }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, background: "#04101f" }}>
            <Image src="/times-computers-logo.png" alt="Times Computers" width={84} height={84} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 28, letterSpacing: "-0.5px" }}>Times Computers</div>
          <div style={{ color: "#6f6a85", fontSize: 15, marginBottom: 22 }}>Faculty Attendance &amp; Workforce Suite</div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#57506e" }}>Email or Faculty ID</label>
              <input type="text" required autoComplete="username" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="you@timescomputers.com or FAC-101" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#57506e" }}>Password</label>
              <input type="password" required autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            {loginError && (
              <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(226,85,123,0.10)", border: "1px solid rgba(226,85,123,0.25)", color: "#b13a60", fontSize: 13, fontWeight: 600 }}>{loginError}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 10 }}>
              <button type="submit" disabled={loginLoading} style={{ ...primaryBtn, opacity: loginLoading ? 0.7 : 1 }}>{loginLoading ? "Signing in…" : "Sign in"}</button>
            </div>
          </form>
          <div style={{ fontSize: 12.5, color: "#a29dbb", marginTop: 16 }}>Contact your administrator if you don&apos;t have an account yet.</div>
        </div>
      </div>
    );
  }

  if (session.user.role === "EMPLOYEE") {
    return (
      <div className="rp-page" style={{ minHeight: "100vh", padding: "24px 32px 48px", boxSizing: "border-box", maxWidth: 1280, margin: "0 auto" }}>
        <div className="rp-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, padding: "14px 22px", boxShadow: "0 8px 30px rgba(109,90,230,0.10)" }}>
          <div className="rp-topbar-brand" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#04101f", flexShrink: 0 }}>
              <Image src="/times-computers-logo.png" alt="Times Computers" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
            <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 18, whiteSpace: "nowrap" }}>Times Computers</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5a48c9", background: "rgba(109,90,230,0.12)", padding: "4px 12px", borderRadius: 999, letterSpacing: "0.4px", whiteSpace: "nowrap" }}>FACULTY</div>
          </div>
          <div className="rp-topbar-right" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="rp-net-chip" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 999, background: netChip.bg, color: netChip.color, maxWidth: "100%", overflowWrap: "break-word", wordBreak: "break-word", boxSizing: "border-box" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", animation: "pulseDot 2s infinite", flexShrink: 0 }}></div>
              {netChip.label}
            </div>
            <div className="rp-topbar-user" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1fa97a,#7ad9b8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{initials(session.user.name ?? "Employee")}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{session.user.name}</div>
            </div>
            <button onClick={logout} style={{ padding: "8px 16px", border: "1px solid rgba(109,90,230,0.25)", borderRadius: 12, background: "rgba(255,255,255,0.55)", color: "#5a48c9", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Logout</button>
          </div>
        </div>

        <div className="rp-two-col" style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22, marginTop: 22, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="rp-card" style={{ ...glass, padding: 30, display: "flex", flexDirection: "column", gap: 6, animation: "fadeUp .4s ease" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#6f6a85" }}>{todayDate}</div>
              <div className="rp-clock" style={{ fontFamily: sora, fontWeight: 800, fontSize: 52, letterSpacing: "-1.5px", lineHeight: 1.1 }}>{clock}</div>
              <div style={{ fontSize: 13.5, color: "#6f6a85", marginTop: 2 }}>Shift {fmtShift()} · Grace {stGrace} min · Check-in after {fmtLateAfter()} counts as late</div>

              {onOfficeNetwork === false && (
                <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 16, background: "rgba(226,85,123,0.10)", border: "1px solid rgba(226,85,123,0.25)", color: "#b13a60", fontSize: 14, fontWeight: 600, lineHeight: 1.5, overflowWrap: "anywhere" }}>
                  Check-in blocked — connect to the office WiFi and this will turn green automatically.
                  {detectedIP && <span style={{ display: "block", marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "#8a8499" }}>Your device&apos;s current IP: {detectedIP}</span>}
                </div>
              )}

              {checkInError && (
                <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 14, background: "rgba(226,85,123,0.10)", border: "1px solid rgba(226,85,123,0.25)", color: "#b13a60", fontSize: 13, fontWeight: 600, overflowWrap: "break-word", wordBreak: "break-word" }}>{checkInError}</div>
              )}

              {onOfficeNetwork === true && !checkedIn && (
                <button onClick={doCheckIn} style={{ marginTop: 18, padding: 17, border: "none", borderRadius: 18, background: "linear-gradient(135deg,#1fa97a,#3cc492)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 28px rgba(31,169,122,0.35)" }}>Check In</button>
              )}

              {checkedIn && (
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)" }}>
                  <div style={{ fontSize: 14, color: "#147a58", fontWeight: 600 }}>Checked in at <span style={{ fontWeight: 800 }}>{fmtTime(todayRecord?.checkInAt ?? null)}</span></div>
                  <div style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: inPill.bg, color: inPill.color }}>{checkInLate ? "Late" : "On time"}</div>
                </div>
              )}

              {checkedIn && !checkedOut && !showCheckoutForm && (
                <button onClick={() => setShowCheckoutForm(true)} style={{ marginTop: 12, padding: 15, border: "1px solid rgba(226,85,123,0.35)", borderRadius: 18, background: "rgba(255,255,255,0.6)", color: "#b13a60", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Check Out</button>
              )}

              {showCheckoutForm && (
                <div style={{ marginTop: 14, padding: 18, borderRadius: 16, background: "rgba(109,90,230,0.06)", border: "1px solid rgba(109,90,230,0.15)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 14.5 }}>End-of-day summary</div>
                  <div className="rp-form-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input placeholder="Batch assigned" value={coBatch} onChange={(e) => setCoBatch(e.target.value)} style={smallInput} />
                    <input type="number" min={0} placeholder="Classes taken" value={coClasses} onChange={(e) => setCoClasses(e.target.value)} style={smallInput} />
                    <input type="number" min={0} placeholder="Students present" value={coStudentsPresent} onChange={(e) => setCoStudentsPresent(e.target.value)} style={smallInput} />
                    <input type="number" min={0} placeholder="Students absent" value={coStudentsAbsent} onChange={(e) => setCoStudentsAbsent(e.target.value)} style={smallInput} />
                    <input type="number" min={0} placeholder="Break (minutes)" value={coBreak} onChange={(e) => setCoBreak(e.target.value)} style={smallInput} />
                  </div>
                  <textarea placeholder="Remarks (optional)" value={coRemarks} onChange={(e) => setCoRemarks(e.target.value)} rows={2} style={{ ...smallInput, resize: "vertical" }} />
                  {checkOutError && <div style={{ color: "#b13a60", fontSize: 12.5, fontWeight: 600, overflowWrap: "break-word", wordBreak: "break-word" }}>{checkOutError}</div>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={submitCheckout} style={{ padding: "11px 20px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#e2557b,#c94069)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Submit &amp; check out</button>
                    <button onClick={() => setShowCheckoutForm(false)} style={{ padding: "11px 20px", border: "1px solid rgba(109,90,230,0.2)", borderRadius: 12, background: "transparent", color: "#57506e", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {checkedOut && (
                <div style={{ marginTop: 12, padding: "14px 18px", borderRadius: 16, background: "rgba(42,143,219,0.08)", border: "1px solid rgba(42,143,219,0.2)", color: "#1f6dab", fontSize: 14, fontWeight: 600 }}>Checked out at {fmtTime(todayRecord?.checkOutAt ?? null)} — see you tomorrow!</div>
              )}
            </div>

            <div className="rp-late-card rp-card" style={{ ...glass, padding: "26px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Late arrivals (last 14 days)</div>
                <div style={{ fontSize: 13.5, color: "#6f6a85", lineHeight: 1.5 }}>
                  {cutNow ? `You have ${myRecentLates} lates — 1 day salary will be deducted this month.` : `You have ${myRecentLates} lates. Watch the ${stCut}-late threshold.`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {lateDots.map((dot, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: dot.bg, border: `2px solid ${dot.border}` }}></div>
                ))}
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 22, marginLeft: 6, color: "#a8641a" }}>{myRecentLates}<span style={{ fontSize: 14, color: "#a29dbb", fontWeight: 600 }}>/{stCut}</span></div>
              </div>
            </div>

            <div className="rp-card" style={{ ...glass, padding: "26px 30px" }}>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 16 }}>My attendance — last 14 days</div>
              <div className="rp-table-scroll">
              <div className="rp-tbl-5" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.7fr 1fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>DATE</div><div>CHECK IN</div><div>CHECK OUT</div><div>HOURS</div><div>STATUS</div>
              </div>
              {myDays.length === 0 && <div style={{ padding: "16px 10px", color: "#a29dbb", fontSize: 13.5 }}>No attendance recorded yet.</div>}
              {myDays.map((dd, i) => (
                <div key={i} className="rp-tbl-5" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.7fr 1fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5 }}>
                  <div style={{ fontWeight: 600 }}>{dd.date}</div>
                  <div style={{ color: "#57506e" }}>{dd.in}</div>
                  <div style={{ color: "#57506e" }}>{dd.out}</div>
                  <div style={{ color: "#57506e" }}>{dd.hours}</div>
                  <div><span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: dd.pillBg, color: dd.pillColor }}>{dd.status}</span></div>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div className="rp-card" style={{ ...glass, padding: "26px 28px", animation: "fadeUp .5s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Notice board</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5a48c9", background: "rgba(109,90,230,0.12)", padding: "4px 12px", borderRadius: 999 }}>{notices.length} notices</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {noticeItems.map((n) => (
                  <div key={n.id} style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(109,90,230,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{n.title}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: n.prBg, color: n.prColor, whiteSpace: "nowrap" }}>{n.priority}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "#57506e", lineHeight: 1.55 }}>{n.body}</div>
                    <div style={{ fontSize: 12, color: "#a29dbb", marginTop: 8 }}>{n.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-card" style={{ ...glass, padding: "26px 28px" }}>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Request leave</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select value={lvType} onChange={(e) => setLvType(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, color: "#2b2440", outline: "none" }}>
                  <option>Casual leave</option><option>Sick leave</option><option>Annual leave</option><option>Half day</option>
                </select>
                <div className="rp-form-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input type="date" value={lvFrom} onChange={(e) => setLvFrom(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, color: "#2b2440", outline: "none", boxSizing: "border-box", width: "100%" }} />
                  <input type="date" value={lvTo} onChange={(e) => setLvTo(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, color: "#2b2440", outline: "none", boxSizing: "border-box", width: "100%" }} />
                </div>
                <textarea placeholder="Reason…" value={lvReason} onChange={(e) => setLvReason(e.target.value)} rows={3} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, color: "#2b2440", outline: "none", resize: "vertical", boxSizing: "border-box", width: "100%" }}></textarea>
                <button onClick={submitLeave} style={{ padding: 13, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(109,90,230,0.3)" }}>Submit request</button>
                {lvSent && (
                  <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)", color: "#147a58", fontSize: 13, fontWeight: 600 }}>Request sent — pending admin approval.</div>
                )}
              </div>
              {myLeaves.length > 0 && (
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px" }}>MY REQUESTS</div>
                  {myLeaves.map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderRadius: 13, background: "rgba(255,255,255,0.5)", border: "1px solid rgba(109,90,230,0.1)", fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{l.type} · {l.range}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: l.stBg, color: l.stColor }}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin
  return (
    <div className="rp-admin-shell" style={{ minHeight: "100vh", display: "flex", gap: 24, padding: 24, boxSizing: "border-box", maxWidth: 1440, margin: "0 auto" }}>
      <div className="rp-mobile-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#04101f", flexShrink: 0 }}>
            <Image src="/times-computers-logo.png" alt="Times Computers" width={32} height={32} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 15 }}>Times Computers</div>
        </div>
        <button aria-label="Open menu" onClick={() => setMobileNavOpen(true)} className="rp-hamburger-btn">
          <span></span><span></span><span></span>
        </button>
      </div>
      {mobileNavOpen && <div className="rp-sidebar-overlay" onClick={() => setMobileNavOpen(false)}></div>}
      <div className={mobileNavOpen ? "rp-sidebar rp-sidebar-open" : "rp-sidebar"} style={{ width: 236, flexShrink: 0, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)", border: "1px solid rgba(255,255,255,0.78)", borderRadius: 24, boxShadow: "0 12px 40px rgba(109,90,230,0.12)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6, position: "sticky", top: 24, height: "calc(100vh - 48px)", boxSizing: "border-box" }}>
        <div className="rp-sidebar-header" style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 10px 18px", borderBottom: "1px solid rgba(109,90,230,0.1)", marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#04101f", flexShrink: 0 }}>
            <Image src="/times-computers-logo.png" alt="Times Computers" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div>
            <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Times Computers</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a48c9", letterSpacing: "0.5px" }}>ADMIN PANEL</div>
          </div>
          <button aria-label="Close menu" onClick={() => setMobileNavOpen(false)} className="rp-sidebar-close">✕</button>
        </div>
        <div className="rp-sidebar-nav">
        {navItems.map((nv) => (
          <button key={nv.key} onClick={() => { nv.go(); setMobileNavOpen(false); }} className="rp-nav-btn" style={nv.active
            ? { textAlign: "left", padding: "12px 16px", border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(109,90,230,0.3)" }
            : { textAlign: "left", padding: "12px 16px", border: "none", borderRadius: 14, background: "transparent", color: "#57506e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{nv.label}</button>
        ))}
        </div>
        <div className="rp-sidebar-spacer" style={{ flex: 1 }}></div>
        <button onClick={logout} className="rp-nav-btn" style={{ padding: 12, border: "1px solid rgba(109,90,230,0.22)", borderRadius: 14, background: "rgba(255,255,255,0.55)", color: "#5a48c9", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Logout</button>
      </div>

      <div className="rp-admin-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>

        {tab === "dash" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "fadeUp .4s ease" }}>
            <div className="rp-header-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Today&apos;s attendance</div>
                <div style={{ fontSize: 14, color: "#6f6a85", marginTop: 4 }}>{todayDate} · Office IP {stIP} · Shift {fmtShift()}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={refreshAdminAttendance} style={{ padding: "8px 16px", border: "1px solid rgba(109,90,230,0.25)", borderRadius: 12, background: "rgba(255,255,255,0.55)", color: "#5a48c9", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 20 }}>{clock}</div>
              </div>
            </div>
            <div className="rp-stats-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {statCards.map((s, i) => (
                <div key={i} className="rp-card" style={{ ...glass, borderRadius: 22, boxShadow: "0 12px 40px rgba(109,90,230,0.10)", padding: "22px 24px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.color, letterSpacing: "0.4px" }}>{s.label}</div>
                  <div className="rp-stat-value" style={{ fontFamily: sora, fontWeight: 800, fontSize: 38, letterSpacing: "-1px", marginTop: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: "#a29dbb", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="rp-two-col" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 22, alignItems: "start" }}>
              <div className="rp-card" style={{ ...glass, padding: "24px 28px" }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Live check-ins</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {liveFeed.length === 0 && <div style={{ color: "#a29dbb", fontSize: 13.5 }}>No check-ins yet today.</div>}
                  {liveFeed.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", borderBottom: "1px solid rgba(109,90,230,0.07)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6d5ae6,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{f.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                        <div style={{ fontSize: 12.5, color: "#a29dbb" }}>{f.dept}</div>
                      </div>
                      <div style={{ fontSize: 13.5, color: "#57506e", fontWeight: 600 }}>{f.time}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: f.pillBg, color: f.pillColor }}>{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rp-card" style={{ ...glass, padding: "24px 28px" }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Late tracker</div>
                <div style={{ fontSize: 13, color: "#6f6a85", marginBottom: 14 }}>{stCut} lates in a month = 1 day salary cut</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {atRisk.length === 0 && <div style={{ color: "#a29dbb", fontSize: 13.5 }}>No one at risk this month.</div>}
                  {atRisk.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 15px", borderRadius: 14, background: r.bg, border: `1px solid ${r.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "#8a8499" }}>{r.dept}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 17, color: r.color }}>{r.lates} lates</div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: r.color }}>{r.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "emp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Faculty accounts <span style={{ fontSize: 16, color: "#a29dbb", fontWeight: 600 }}>· {dbUsers.length} total · stored in database</span></div>
            <div className="rp-card" style={{ ...glass, borderRadius: 20, boxShadow: "0 12px 40px rgba(109,90,230,0.10)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input placeholder="Full name" value={neName} onChange={(e) => setNeName(e.target.value)} style={{ flex: 1.2, minWidth: 150, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <input type="email" placeholder="Email" value={neEmail} onChange={(e) => setNeEmail(e.target.value)} style={{ flex: 1.2, minWidth: 170, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <input type="password" placeholder="Temporary password" value={nePassword} onChange={(e) => setNePassword(e.target.value)} style={{ flex: 1.2, minWidth: 170, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <input placeholder="Faculty ID" value={neCode} onChange={(e) => setNeCode(e.target.value)} style={{ flex: 0.7, minWidth: 110, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input placeholder="Department" value={neDept} onChange={(e) => setNeDept(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <input placeholder="Designation" value={neJobTitle} onChange={(e) => setNeJobTitle(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <input placeholder="Branch / location" value={neBranch} onChange={(e) => setNeBranch(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
                <select value={neRoleField} onChange={(e) => setNeRoleField(e.target.value as "ADMIN" | "EMPLOYEE")} style={{ flex: 1, minWidth: 130, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }}>
                  <option value="EMPLOYEE">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button onClick={createUser} disabled={createUserLoading} style={{ padding: "11px 22px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(109,90,230,0.3)", opacity: createUserLoading ? 0.7 : 1 }}>{createUserLoading ? "Creating…" : "+ Create account"}</button>
              </div>
              {createUserError && (
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(226,85,123,0.10)", border: "1px solid rgba(226,85,123,0.25)", color: "#b13a60", fontSize: 13, fontWeight: 600 }}>{createUserError}</div>
              )}
              <div style={{ fontSize: 12, color: "#a29dbb" }}>Passwords are hashed (bcrypt) before being stored — never kept in plain text.</div>
            </div>
            <div className="rp-card" style={{ ...glass, padding: "22px 26px" }}>
              <div className="rp-table-scroll">
              <div className="rp-tbl-7" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.8fr 1fr 1fr 1fr 0.8fr 0.8fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>NAME</div><div>EMAIL</div><div>FACULTY ID</div><div>DEPARTMENT</div><div>BRANCH</div><div>ROLE</div><div></div>
              </div>
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {usersLoading && <div style={{ padding: "16px 10px", color: "#a29dbb", fontSize: 13.5 }}>Loading faculty…</div>}
                {!usersLoading && dbUsers.length === 0 && <div style={{ padding: "16px 10px", color: "#a29dbb", fontSize: 13.5 }}>No accounts yet — create the first one above.</div>}
                {dbUsers.map((u) => {
                  const p = u.role === "ADMIN" ? { bg: "rgba(109,90,230,0.12)", color: "#5a48c9" } : { bg: "rgba(31,169,122,0.14)", color: "#147a58" };
                  return (
                    <div key={u.id} className="rp-tbl-7" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.8fr 1fr 1fr 1fr 0.8fr 0.8fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6d5ae6,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{initials(u.name)}</div>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      </div>
                      <div style={{ color: "#57506e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                      <div style={{ color: "#57506e" }}>{u.employeeCode || "—"}</div>
                      <div style={{ color: "#57506e" }}>{u.department}</div>
                      <div style={{ color: "#57506e" }}>{u.branch}</div>
                      <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: p.bg, color: p.color }}>{u.role}</span></div>
                      <button onClick={() => removeUser(u.id)} disabled={u.id === session.user.id} style={{ padding: "6px 12px", border: "1px solid rgba(226,85,123,0.3)", borderRadius: 10, background: "transparent", color: "#b13a60", fontSize: 12, fontWeight: 700, cursor: u.id === session.user.id ? "not-allowed" : "pointer", opacity: u.id === session.user.id ? 0.4 : 1 }}>Remove</button>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        )}

        {tab === "rep" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div className="rp-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Monthly report</div>
              <button style={{ padding: "11px 20px", border: "1px solid rgba(109,90,230,0.25)", borderRadius: 12, background: "rgba(255,255,255,0.6)", color: "#5a48c9", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Export CSV</button>
            </div>
            <div className="rp-stats-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <div className="rp-card" style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#147a58" }}>FACULTY TRACKED</div>
                <div className="rp-stat-value" style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{reportRows.length}</div>
              </div>
              <div className="rp-card" style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#a8641a" }}>TOTAL LATES</div>
                <div className="rp-stat-value" style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{totalLates}</div>
              </div>
              <div className="rp-card" style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#b13a60" }}>SALARY-CUT DAYS</div>
                <div className="rp-stat-value" style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{totalCuts}</div>
              </div>
            </div>
            <div className="rp-card" style={{ ...glass, padding: "18px 22px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                placeholder="Search faculty by name…"
                value={repQuery}
                onChange={(e) => setRepQuery(e.target.value)}
                style={{ flex: 1.5, minWidth: 200, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }}
              />
              <select
                value={repDept}
                onChange={(e) => setRepDept(e.target.value)}
                style={{ flex: 1, minWidth: 160, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }}
              >
                <option value="">All departments</option>
                {reportDepts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {(repQuery || repDept) && (
                <button
                  onClick={() => { setRepQuery(""); setRepDept(""); }}
                  style={{ padding: "10px 16px", border: "1px solid rgba(109,90,230,0.2)", borderRadius: 12, background: "transparent", color: "#57506e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Clear
                </button>
              )}
              <div style={{ fontSize: 12.5, color: "#a29dbb" }}>Showing {filteredReportRows.length} of {reportRows.length}</div>
            </div>
            <div className="rp-card" style={{ ...glass, padding: "22px 26px" }}>
              <div className="rp-table-scroll">
              <div className="rp-tbl-8" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>FACULTY</div><div>DEPARTMENT</div><div>PRESENT</div><div>LATE</div><div>ABSENT</div><div>LEAVE</div><div>HOURS</div><div>DEDUCTION</div>
              </div>
              <div style={{ maxHeight: 560, overflowY: "auto" }}>
                {filteredReportRows.length === 0 && <div style={{ padding: "16px 10px", color: "#a29dbb", fontSize: 13.5 }}>No matching records.</div>}
                {filteredReportRows.map((r, i) => (
                  <div key={i} className="rp-tbl-8" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5, background: r.rowBg, borderRadius: 10 }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: "#57506e" }}>{r.dept}</div>
                    <div style={{ fontWeight: 600, color: "#147a58" }}>{r.present}</div>
                    <div style={{ fontWeight: 700, color: r.lateColor }}>{r.late}</div>
                    <div style={{ color: "#57506e" }}>{r.absent}</div>
                    <div style={{ color: "#57506e" }}>{r.leave}</div>
                    <div style={{ color: "#57506e" }}>{r.hours}h</div>
                    <div style={{ fontWeight: 700, color: r.cutColor }}>{r.cut}</div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        )}

        {tab === "not" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Notice board</div>
            <div className="rp-two-col" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 22, alignItems: "start" }}>
              <div className="rp-card" style={{ ...glass, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Send a notice</div>
                <input placeholder="Notice title" value={ntTitle} onChange={(e) => setNtTitle(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none" }} />
                <textarea placeholder="Write your message to all faculty…" value={ntBody} onChange={(e) => setNtBody(e.target.value)} rows={5} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", resize: "vertical" }}></textarea>
                <select value={ntPriority} onChange={(e) => setNtPriority(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none" }}>
                  <option>Normal</option><option>Important</option><option>Urgent</option>
                </select>
                <button onClick={sendNotice} style={{ padding: 14, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(109,90,230,0.3)" }}>Publish to all faculty</button>
                {ntSent && (
                  <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)", color: "#147a58", fontSize: 13, fontWeight: 600 }}>Notice published — visible on every faculty portal.</div>
                )}
              </div>
              <div className="rp-card" style={{ ...glass, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Published notices</div>
                {noticeItems.map((n) => (
                  <div key={n.id} style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(109,90,230,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{n.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: n.prBg, color: n.prColor, whiteSpace: "nowrap" }}>{n.priority}</span>
                        <button onClick={n.del} style={{ padding: "4px 10px", border: "1px solid rgba(226,85,123,0.3)", borderRadius: 9, background: "transparent", color: "#b13a60", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 13.5, color: "#57506e", lineHeight: 1.55 }}>{n.body}</div>
                    <div style={{ fontSize: 12, color: "#a29dbb", marginTop: 8 }}>{n.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "lea" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Leave requests <span style={{ fontSize: 16, color: "#a29dbb", fontWeight: 600 }}>· {leaves.filter((l) => l.status === "Pending").length} pending</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {leaveRows.map((l) => (
                <div key={l.id} className="rp-leave-card rp-card" style={{ ...glass, borderRadius: 20, boxShadow: "0 10px 32px rgba(109,90,230,0.10)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: l.avBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>{l.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name} <span style={{ fontWeight: 600, color: "#6f6a85", fontSize: 13.5 }}>· {l.type}</span></div>
                    <div style={{ fontSize: 13, color: "#6f6a85", marginTop: 3 }}>{l.range} — &quot;{l.reason}&quot;</div>
                  </div>
                  {l.pending && (
                    <div className="rp-leave-actions" style={{ display: "flex", gap: 10 }}>
                      <button onClick={l.approve} style={{ padding: "10px 20px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1fa97a,#3cc492)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(31,169,122,0.3)" }}>Approve</button>
                      <button onClick={l.reject} style={{ padding: "10px 20px", border: "1px solid rgba(226,85,123,0.35)", borderRadius: 12, background: "rgba(255,255,255,0.6)", color: "#b13a60", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                    </div>
                  )}
                  {l.decided && (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 999, background: l.stBg, color: l.stColor }}>{l.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "set" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease", maxWidth: 640 }}>
            <div className="rp-page-title" style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Attendance settings</div>
            <div className="rp-card" style={{ ...glass, padding: "28px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#57506e" }}>Office IP address(es) — comma-separated (the same WiFi can show up as an IPv4 or IPv6 address depending on the device, so add both if a check-in gets rejected)</label>
                <input value={stIP} onChange={(e) => setStIP(e.target.value)} placeholder="e.g. 49.36.202.50, 2405:201:5502:c32c::/64" style={{ padding: "13px 16px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14.5, outline: "none", fontWeight: 600, wordBreak: "break-word" }} />
              </div>
              <div className="rp-stats-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#57506e" }}>Shift start</label>
                  <input type="time" value={stShift} onChange={(e) => setStShift(e.target.value)} style={{ padding: "13px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", boxSizing: "border-box", width: "100%" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#57506e" }}>Grace (minutes)</label>
                  <input type="number" value={stGrace} onChange={(e) => setStGrace(Number(e.target.value))} style={{ padding: "13px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", boxSizing: "border-box", width: "100%" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#57506e" }}>Lates per salary cut</label>
                  <input type="number" value={stCut} onChange={(e) => setStCut(Number(e.target.value))} style={{ padding: "13px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", boxSizing: "border-box", width: "100%" }} />
                </div>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(109,90,230,0.07)", border: "1px solid rgba(109,90,230,0.15)", fontSize: 13, color: "#57506e", lineHeight: 1.6 }}>
                Rule preview: check-in after <b>{fmtLateAfter()}</b> is marked <b>Late</b>. Every <b>{stCut} lates</b> in a month deducts <b>1 day</b> of salary. Attendance is only accepted from IP <b>{stIP}</b>. Settings are saved to the database and apply to every check-in server-side.
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: onOfficeNetwork ? "rgba(31,169,122,0.10)" : "rgba(226,85,123,0.08)", border: `1px solid ${onOfficeNetwork ? "rgba(31,169,122,0.25)" : "rgba(226,85,123,0.22)"}`, fontSize: 13, fontWeight: 600, color: onOfficeNetwork ? "#147a58" : "#b13a60", lineHeight: 1.55, overflowWrap: "anywhere" }}>
                {onOfficeNetwork === null ? "Checking this device's network…" : onOfficeNetwork ? "✓ This device is on the office network" : "✗ This device is NOT on the office network"}
                {detectedIP && <span style={{ display: "block", marginTop: 4, fontWeight: 500, color: "#8a8499" }}>This device&apos;s IP: {detectedIP}</span>}
                {suggestedEntry && !onOfficeNetwork && (
                  <button
                    onClick={() => {
                      const entries = stIP.split(",").map((s) => s.trim()).filter(Boolean);
                      if (!entries.includes(suggestedEntry)) setStIP([...entries, suggestedEntry].join(", "));
                    }}
                    style={{ display: "block", marginTop: 10, padding: "9px 16px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    + Add this network ({suggestedEntry}) — then press Save settings
                  </button>
                )}
              </div>
              <button onClick={saveSettings} style={{ padding: 14, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(109,90,230,0.3)", alignSelf: "flex-start", paddingLeft: 32, paddingRight: 32 }}>Save settings</button>
              {saved && (
                <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)", color: "#147a58", fontSize: 13, fontWeight: 600 }}>Settings saved.</div>
              )}
            </div>

            <div className="rp-card" style={{ ...glass, padding: "28px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Setup guide</div>
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(109,90,230,0.07)", border: "1px solid rgba(109,90,230,0.15)", fontSize: 13.5, color: "#57506e", lineHeight: 1.6, overflowWrap: "anywhere" }}>
                Portal link (share this with faculty):{" "}
                <a href="https://timescomputer.networkingexperts.in" style={{ color: "#5a48c9", fontWeight: 700 }}>timescomputer.networkingexperts.in</a>
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "#57506e", lineHeight: 1.6 }}>
                <li>
                  <b>Set your office IP(s) above.</b> On an office computer, search Google for &quot;what is my IP&quot; and add the address here. The same WiFi can show an IPv4 <i>and</i> an IPv6 address — add both, separated by a comma. If a faculty check-in is rejected, their error message shows the IP their device used: add that IP to the list and save.
                </li>
                <li>
                  <b>Set the shift start, grace minutes and lates-per-cut</b>, then press Save settings. Check-ins after shift start + grace are marked Late automatically; every {stCut || 3} lates in a month deducts one day of salary in the monthly report.
                </li>
                <li>
                  <b>Create accounts in the Faculty accounts tab</b> — name, email, a temporary password and Faculty ID. Give each person their email, password and the portal link above.
                </li>
                <li>
                  <b>Faculty daily use:</b> open the portal link on office WiFi, sign in, press Check In on arrival and Check Out when leaving (the checkout form records classes, students and remarks). Attendance appears here on the Dashboard instantly.
                </li>
              </ol>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(232,145,45,0.10)", border: "1px solid rgba(232,145,45,0.25)", color: "#a8641a", fontSize: 13, fontWeight: 600, lineHeight: 1.55 }}>
                Security note: if you are still using the first admin password you received, ask your developer to change it.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
