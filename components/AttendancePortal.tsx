"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Image from "next/image";

type PillStyle = { bg: string; color: string };
type Employee = {
  id: number;
  name: string;
  dept: string;
  role: string;
  today: string;
  inTime: string;
  lates: number;
  absent: number;
  leave: number;
  present: number;
  av: string;
};
type Notice = { id: number; title: string; body: string; priority: string; date: string };
type Leave = { id: number; name: string; dept: string; type: string; range: string; reason: string; status: string };

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

const secondaryBtn: CSSProperties = {
  padding: "15px",
  border: "1px solid rgba(109,90,230,0.3)",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.6)",
  color: "#5a48c9",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
};

const sora = "var(--font-sora), sans-serif";

function pill(status: string): PillStyle {
  if (status === "On time") return { bg: "rgba(31,169,122,0.14)", color: "#147a58" };
  if (status === "Late") return { bg: "rgba(232,145,45,0.16)", color: "#a8641a" };
  if (status === "Absent") return { bg: "rgba(226,85,123,0.13)", color: "#b13a60" };
  if (status === "Leave") return { bg: "rgba(42,143,219,0.13)", color: "#1f6dab" };
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

function seedEmployees(): Employee[] {
  const firsts = ["Ahmed","Fatima","Bilal","Ayesha","Usman","Zainab","Hamza","Maryam","Ali","Sana","Omar","Hira","Danish","Rabia","Kashif","Nida","Imran","Sadia","Faisal","Mahnoor","Adeel","Komal","Junaid","Iqra","Shahzaib"];
  const lasts = ["Raza","Noor","Khan","Siddiqui","Tariq","Ali","Sheikh","Javed","Hassan","Mirza","Farooq","Qureshi","Malik","Aslam","Mehmood"];
  const depts = ["Engineering","Sales","Support","Finance","HR","Design","Operations"];
  const roles: Record<string, string> = { Engineering:"Software Engineer", Sales:"Sales Executive", Support:"Support Agent", Finance:"Accountant", HR:"HR Officer", Design:"UI Designer", Operations:"Ops Coordinator" };
  const avColors = ["linear-gradient(135deg,#6d5ae6,#a78bfa)","linear-gradient(135deg,#1fa97a,#7ad9b8)","linear-gradient(135deg,#e8912d,#f4bc6e)","linear-gradient(135deg,#e2557b,#f0a7c8)","linear-gradient(135deg,#2a8fdb,#7cc0f0)"];
  const employees: Employee[] = [];
  for (let i = 0; i < 75; i++) {
    const name = i === 0 ? "Ahmed Raza" : firsts[(i * 3) % firsts.length] + " " + lasts[(i * 5 + 2) % lasts.length];
    const dept = i === 0 ? "Engineering" : depts[(i * 2 + 1) % depts.length];
    const s = i === 0 ? 0 : (i * 7) % 10;
    let today: string, inTime = "—";
    if (s === 0) today = "Absent";
    else if (s === 1) today = "Leave";
    else if (s <= 3) { today = "Late"; inTime = "9:" + String(6 + ((i * 3) % 40)).padStart(2, "0") + " AM"; }
    else { today = "On time"; inTime = "8:" + String(38 + (i % 21)).padStart(2, "0") + " AM"; }
    const lates = i === 0 ? 2 : (i * 3) % 6;
    const absent = (i * 2) % 3;
    const leave = i % 2;
    employees.push({ id: i, name, dept, role: roles[dept], today, inTime, lates, absent, leave, present: 23 - absent - leave, av: avColors[i % 5] });
  }
  return employees;
}

export default function AttendancePortal() {
  const [view, setView] = useState<"login" | "employee" | "admin">("login");
  const [tab, setTab] = useState("dash");
  const [now, setNow] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInAt, setCheckInAt] = useState<string | null>(null);
  const [checkOutAt, setCheckOutAt] = useState<string | null>(null);
  const [checkInLate, setCheckInLate] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [notices, setNotices] = useState<Notice[]>([
    { id: 1, title: "Eid holidays announced", body: "Office will remain closed from July 27 to July 29. Attendance resumes July 30, 9:00 AM sharp.", priority: "Important", date: "Jul 2, 2026 · 10:15 AM" },
    { id: 2, title: "New attendance policy", body: "Check-in after 9:05 AM is marked late. Three lates in a month will deduct one day of salary.", priority: "Urgent", date: "Jul 1, 2026 · 9:00 AM" },
    { id: 3, title: "Monthly town hall", body: "All-hands meeting this Friday at 4:00 PM in the main hall. Attendance is mandatory.", priority: "Normal", date: "Jun 30, 2026 · 3:30 PM" },
  ]);
  const [leaves, setLeaves] = useState<Leave[]>([
    { id: 1, name: "Bilal Khan", dept: "Sales", type: "Sick leave", range: "Jul 6 – Jul 7", reason: "Fever, doctor advised rest", status: "Pending" },
    { id: 2, name: "Hira Qureshi", dept: "Design", type: "Casual leave", range: "Jul 10", reason: "Family function", status: "Pending" },
    { id: 3, name: "Usman Tariq", dept: "Engineering", type: "Annual leave", range: "Jul 14 – Jul 18", reason: "Planned vacation", status: "Approved" },
    { id: 4, name: "Sana Mirza", dept: "Finance", type: "Half day", range: "Jul 3", reason: "Bank work", status: "Rejected" },
  ]);
  const [onOfficeNetwork, setOnOfficeNetwork] = useState(true);
  const [stIP, setStIP] = useState("192.168.10.1");
  const [stShift, setStShift] = useState("09:00");
  const [stGrace, setStGrace] = useState(5);
  const [stCut, setStCut] = useState(3);
  const [saved, setSaved] = useState(false);
  const [lvType, setLvType] = useState("Casual leave");
  const [lvFrom, setLvFrom] = useState("");
  const [lvTo, setLvTo] = useState("");
  const [lvReason, setLvReason] = useState("");
  const [lvSent, setLvSent] = useState(false);
  const [neName, setNeName] = useState("");
  const [neDept, setNeDept] = useState("");
  const [neRole, setNeRole] = useState("");
  const [q, setQ] = useState("");
  const [ntTitle, setNtTitle] = useState("");
  const [ntBody, setNtBody] = useState("");
  const [ntPriority, setNtPriority] = useState("Normal");
  const [ntSent, setNtSent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function shiftDeadline() {
    const [h, m] = stShift.split(":").map(Number);
    return { h, m: m + Number(stGrace || 0) };
  }
  function fmtShift() {
    const [h, m] = stShift.split(":").map(Number);
    const hh = ((h + 11) % 12) + 1;
    return hh + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
  }
  function fmtLateAfter() {
    const d = shiftDeadline();
    const total = d.h * 60 + d.m;
    const h = Math.floor(total / 60), m = total % 60;
    const hh = ((h + 11) % 12) + 1;
    return hh + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
  }

  const clock = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const todayDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const d = shiftDeadline();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isLateNow = nowMin > d.h * 60 + d.m;
  const myLates = checkedIn && checkInLate ? 3 : 2;
  const cutNow = myLates >= Number(stCut || 3);
  const lateDots = [0, 1, 2].map((i) => (i < myLates ? { bg: "#e8912d", border: "#e8912d" } : { bg: "transparent", border: "rgba(232,145,45,0.45)" }));

  const dayStatuses = ["On time","On time","Late","On time","On time","Weekend","Weekend","On time","Late","On time","On time","Absent","Weekend","Weekend"];
  const myDays: { date: string; in: string; out: string; status: string; pillBg: string; pillColor: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - i);
    const label = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (i === 0) {
      const status = checkedIn ? (checkInLate ? "Late" : "On time") : "Not marked";
      const p = checkedIn ? pill(status) : { bg: "rgba(109,90,230,0.10)", color: "#8a8499" };
      myDays.push({ date: label + " (today)", in: checkInAt || "—", out: checkOutAt || "—", status, pillBg: p.bg, pillColor: p.color });
    } else {
      const s = dayStatuses[i];
      const wk = s === "Weekend", ab = s === "Absent";
      const p = wk ? { bg: "rgba(109,90,230,0.08)", color: "#a29dbb" } : pill(s);
      myDays.push({
        date: label,
        in: wk || ab ? "—" : s === "Late" ? "9:" + (10 + i) + " AM" : "8:5" + (i % 10) + " AM",
        out: wk || ab ? "—" : "6:0" + (i % 8) + " PM",
        status: s, pillBg: p.bg, pillColor: p.color,
      });
    }
  }

  const noticeItems = notices.map((n) => {
    const p = prPill(n.priority);
    return { ...n, prBg: p.bg, prColor: p.color, del: () => setNotices((ns) => ns.filter((x) => x.id !== n.id)) };
  });

  const tabs: [string, string][] = [["dash","Dashboard"],["emp","Employees"],["rep","Monthly report"],["not","Notice board"],["lea","Leave requests"],["set","Settings"]];
  const navItems = tabs.map(([key, label]) => ({ key, label, active: key === tab, go: () => setTab(key) }));

  const emps = employees.map((e) =>
    e.id === 0 ? { ...e, today: checkedIn ? (checkInLate ? "Late" : "On time") : "Absent", inTime: checkInAt || "—", lates: myLates } : e
  );
  const cnt = (s: string) => emps.filter((e) => e.today === s).length;
  const present = cnt("On time") + cnt("Late");
  const statCards = [
    { label: "PRESENT", value: present, sub: "of " + emps.length + " employees", color: "#147a58" },
    { label: "LATE TODAY", value: cnt("Late"), sub: "after " + fmtLateAfter(), color: "#a8641a" },
    { label: "ABSENT", value: cnt("Absent"), sub: "no check-in", color: "#b13a60" },
    { label: "ON LEAVE", value: cnt("Leave"), sub: "approved leaves", color: "#1f6dab" },
  ];
  const liveFeed = emps.filter((e) => e.today === "On time" || e.today === "Late").slice(0, 9).map((e) => {
    const p = pill(e.today);
    return { name: e.name, dept: e.dept, time: e.inTime, status: e.today, pillBg: p.bg, pillColor: p.color, avBg: e.av, initials: initials(e.name) };
  });
  const atRisk = emps.filter((e) => e.lates >= 2).sort((a, b) => b.lates - a.lates).slice(0, 6).map((e) => {
    const cut = e.lates >= Number(stCut || 3);
    return {
      name: e.name, dept: e.dept, lates: e.lates,
      note: cut ? Math.floor(e.lates / Number(stCut || 3)) + " day cut" : "1 more = day cut",
      color: cut ? "#b13a60" : "#a8641a",
      bg: cut ? "rgba(226,85,123,0.08)" : "rgba(232,145,45,0.08)",
      border: cut ? "rgba(226,85,123,0.22)" : "rgba(232,145,45,0.22)",
    };
  });

  const qLower = q.toLowerCase();
  const empRows = emps.filter((e) => !qLower || e.name.toLowerCase().includes(qLower) || e.dept.toLowerCase().includes(qLower)).map((e) => {
    const p = pill(e.today);
    return {
      id: e.id, name: e.name, dept: e.dept, role: e.role, today: e.today, lates: e.lates,
      lateColor: e.lates >= 3 ? "#b13a60" : e.lates >= 2 ? "#a8641a" : "#57506e",
      pillBg: p.bg, pillColor: p.color, avBg: e.av, initials: initials(e.name),
      remove: () => setEmployees((es) => es.filter((x) => x.id !== e.id)),
    };
  });

  const cutOf = (e: Employee) => Math.floor(e.lates / Number(stCut || 3));
  const reportRows = emps.map((e) => {
    const c = cutOf(e);
    return {
      name: e.name, dept: e.dept, present: e.present, late: e.lates, absent: e.absent, leave: e.leave,
      lateColor: e.lates >= 3 ? "#b13a60" : e.lates >= 2 ? "#a8641a" : "#57506e",
      cut: c > 0 ? "−" + c + " day" : "—", cutColor: c > 0 ? "#b13a60" : "#a29dbb",
      rowBg: c > 0 ? "rgba(226,85,123,0.05)" : "transparent",
    };
  });
  const totalLates = emps.reduce((a, e) => a + e.lates, 0);
  const totalCuts = emps.reduce((a, e) => a + cutOf(e), 0);
  const avgAttendance = Math.round((emps.reduce((a, e) => a + e.present, 0) / emps.length / 23) * 100) + "%";

  const leaveRows = leaves.map((l) => {
    const p = pill(l.status);
    return {
      ...l, initials: initials(l.name), avBg: "linear-gradient(135deg,#6d5ae6,#a78bfa)",
      pending: l.status === "Pending", decided: l.status !== "Pending", stBg: p.bg, stColor: p.color,
      approve: () => setLeaves((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "Approved" } : x))),
      reject: () => setLeaves((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "Rejected" } : x))),
    };
  });

  const myLeaves = leaves.filter((l) => l.name === "Ahmed Raza").map((l) => {
    const p = pill(l.status);
    return { type: l.type, range: l.range, status: l.status, stBg: p.bg, stColor: p.color };
  });

  const inPill = checkInLate ? pill("Late") : pill("On time");
  const netChip = onOfficeNetwork
    ? { bg: "rgba(31,169,122,0.14)", color: "#147a58", label: "Office network · " + stIP }
    : { bg: "rgba(226,85,123,0.13)", color: "#b13a60", label: "Not on office network" };

  function doCheckIn() {
    setCheckedIn(true);
    setCheckInLate(isLateNow);
    setCheckInAt(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
  }
  function doCheckOut() {
    setCheckedOut(true);
    setCheckOutAt(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
  }
  function submitLeave() {
    const range = (lvFrom || "TBD") + (lvTo && lvTo !== lvFrom ? " – " + lvTo : "");
    setLeaves((ls) => [{ id: Date.now(), name: "Ahmed Raza", dept: "Engineering", type: lvType, range, reason: lvReason || "—", status: "Pending" }, ...ls]);
    setLvSent(true);
    setLvFrom("");
    setLvTo("");
    setLvReason("");
  }
  function addEmp() {
    setEmployees((es) => [{ id: Date.now(), name: neName || "New Employee", dept: neDept || "General", role: neRole || "Staff", today: "Absent", inTime: "—", lates: 0, absent: 0, leave: 0, present: 0, av: "linear-gradient(135deg,#2a8fdb,#7cc0f0)" }, ...es]);
    setNeName("");
    setNeDept("");
    setNeRole("");
  }
  function sendNotice() {
    setNotices((ns) => [{ id: Date.now(), title: ntTitle || "Untitled notice", body: ntBody || "", priority: ntPriority, date: "Just now" }, ...ns]);
    setNtTitle("");
    setNtBody("");
    setNtSent(true);
  }
  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  function logout() {
    setView("login");
  }

  if (view === "login") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, boxSizing: "border-box" }}>
        <div style={{ ...glass, width: 440, padding: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "fadeUp .5s ease" }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, background: "#04101f" }}>
            <Image src="/times-computers-logo.png" alt="Times Computers" width={84} height={84} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 28, letterSpacing: "-0.5px" }}>Times Computers</div>
          <div style={{ color: "#6f6a85", fontSize: 15, marginBottom: 22 }}>Attendance &amp; Workforce Suite</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#57506e" }}>Email</label>
              <input defaultValue="you@aurorahr.com" readOnly style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#57506e" }}>Password</label>
              <input type="password" defaultValue="password" readOnly style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 22 }}>
            <button onClick={() => setView("admin")} style={primaryBtn}>Sign in as Admin</button>
            <button onClick={() => setView("employee")} style={secondaryBtn}>Sign in as Employee</button>
          </div>
          <div style={{ fontSize: 12.5, color: "#a29dbb", marginTop: 16 }}>Demo prototype — no real credentials needed</div>
        </div>
      </div>
    );
  }

  if (view === "employee") {
    return (
      <div style={{ minHeight: "100vh", padding: "24px 32px 48px", boxSizing: "border-box", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, padding: "14px 22px", boxShadow: "0 8px 30px rgba(109,90,230,0.10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#04101f" }}>
              <Image src="/times-computers-logo.png" alt="Times Computers" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
            <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 18 }}>Times Computers</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5a48c9", background: "rgba(109,90,230,0.12)", padding: "4px 12px", borderRadius: 999, letterSpacing: "0.4px" }}>EMPLOYEE</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 999, background: netChip.bg, color: netChip.color }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", animation: "pulseDot 2s infinite" }}></div>
              {netChip.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1fa97a,#7ad9b8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>AR</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Ahmed Raza</div>
            </div>
            <button onClick={logout} style={{ padding: "8px 16px", border: "1px solid rgba(109,90,230,0.25)", borderRadius: 12, background: "rgba(255,255,255,0.55)", color: "#5a48c9", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Logout</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22, marginTop: 22, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ ...glass, padding: 30, display: "flex", flexDirection: "column", gap: 6, animation: "fadeUp .4s ease" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#6f6a85" }}>{todayDate}</div>
              <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 52, letterSpacing: "-1.5px", lineHeight: 1.1 }}>{clock}</div>
              <div style={{ fontSize: 13.5, color: "#6f6a85", marginTop: 2 }}>Shift {fmtShift()} · Grace {stGrace} min · Check-in after {fmtLateAfter()} counts as late</div>

              {!onOfficeNetwork && (
                <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 16, background: "rgba(226,85,123,0.10)", border: "1px solid rgba(226,85,123,0.25)", color: "#b13a60", fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                  Check-in blocked — you are not connected to the office network ({stIP}). Attendance can only be marked from the office computer/IP.
                </div>
              )}

              {onOfficeNetwork && !checkedIn && (
                <button onClick={doCheckIn} style={{ marginTop: 18, padding: 17, border: "none", borderRadius: 18, background: "linear-gradient(135deg,#1fa97a,#3cc492)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 28px rgba(31,169,122,0.35)" }}>Check In</button>
              )}

              {checkedIn && (
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)" }}>
                  <div style={{ fontSize: 14, color: "#147a58", fontWeight: 600 }}>Checked in at <span style={{ fontWeight: 800 }}>{checkInAt}</span></div>
                  <div style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: inPill.bg, color: inPill.color }}>{checkInLate ? "Late" : "On time"}</div>
                </div>
              )}

              {checkedIn && !checkedOut && (
                <button onClick={doCheckOut} style={{ marginTop: 12, padding: 15, border: "1px solid rgba(226,85,123,0.35)", borderRadius: 18, background: "rgba(255,255,255,0.6)", color: "#b13a60", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Check Out</button>
              )}

              {checkedOut && (
                <div style={{ marginTop: 12, padding: "14px 18px", borderRadius: 16, background: "rgba(42,143,219,0.08)", border: "1px solid rgba(42,143,219,0.2)", color: "#1f6dab", fontSize: 14, fontWeight: 600 }}>Checked out at {checkOutAt} — see you tomorrow!</div>
              )}
            </div>

            <div style={{ ...glass, padding: "26px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Late arrivals this month</div>
                <div style={{ fontSize: 13.5, color: "#6f6a85", lineHeight: 1.5 }}>
                  {cutNow ? `You have reached ${myLates} lates — 1 day salary will be deducted this month.` : `You have ${myLates} lates. One more late arrival will deduct 1 day of salary.`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {lateDots.map((dot, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: dot.bg, border: `2px solid ${dot.border}` }}></div>
                ))}
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 22, marginLeft: 6, color: "#a8641a" }}>{myLates}<span style={{ fontSize: 14, color: "#a29dbb", fontWeight: 600 }}>/3</span></div>
              </div>
            </div>

            <div style={{ ...glass, padding: "26px 30px" }}>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 16 }}>My attendance — last 14 days</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>DATE</div><div>CHECK IN</div><div>CHECK OUT</div><div>STATUS</div>
              </div>
              {myDays.map((dd, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5 }}>
                  <div style={{ fontWeight: 600 }}>{dd.date}</div>
                  <div style={{ color: "#57506e" }}>{dd.in}</div>
                  <div style={{ color: "#57506e" }}>{dd.out}</div>
                  <div><span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: dd.pillBg, color: dd.pillColor }}>{dd.status}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ ...glass, padding: "26px 28px", animation: "fadeUp .5s ease" }}>
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

            <div style={{ ...glass, padding: "26px 28px" }}>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Request leave</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select value={lvType} onChange={(e) => setLvType(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, color: "#2b2440", outline: "none" }}>
                  <option>Casual leave</option><option>Sick leave</option><option>Annual leave</option><option>Half day</option>
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", gap: 24, padding: 24, boxSizing: "border-box", maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ width: 236, flexShrink: 0, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)", border: "1px solid rgba(255,255,255,0.78)", borderRadius: 24, boxShadow: "0 12px 40px rgba(109,90,230,0.12)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6, position: "sticky", top: 24, height: "calc(100vh - 48px)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 10px 18px", borderBottom: "1px solid rgba(109,90,230,0.1)", marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#04101f", flexShrink: 0 }}>
            <Image src="/times-computers-logo.png" alt="Times Computers" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>
          <div>
            <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Times Computers</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a48c9", letterSpacing: "0.5px" }}>ADMIN PANEL</div>
          </div>
        </div>
        {navItems.map((nv) => (
          <button key={nv.key} onClick={nv.go} style={nv.active
            ? { textAlign: "left", padding: "12px 16px", border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(109,90,230,0.3)" }
            : { textAlign: "left", padding: "12px 16px", border: "none", borderRadius: 14, background: "transparent", color: "#57506e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{nv.label}</button>
        ))}
        <div style={{ flex: 1 }}></div>
        <button onClick={logout} style={{ padding: 12, border: "1px solid rgba(109,90,230,0.22)", borderRadius: 14, background: "rgba(255,255,255,0.55)", color: "#5a48c9", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Logout</button>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>

        {tab === "dash" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "fadeUp .4s ease" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Today&apos;s attendance</div>
                <div style={{ fontSize: 14, color: "#6f6a85", marginTop: 4 }}>{todayDate} · Office IP {stIP} · Shift {fmtShift()}</div>
              </div>
              <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 20 }}>{clock}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {statCards.map((s, i) => (
                <div key={i} style={{ ...glass, borderRadius: 22, boxShadow: "0 12px 40px rgba(109,90,230,0.10)", padding: "22px 24px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.color, letterSpacing: "0.4px" }}>{s.label}</div>
                  <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 38, letterSpacing: "-1px", marginTop: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: "#a29dbb", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 22, alignItems: "start" }}>
              <div style={{ ...glass, padding: "24px 28px" }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Live check-ins</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {liveFeed.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", borderBottom: "1px solid rgba(109,90,230,0.07)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: f.avBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{f.initials}</div>
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
              <div style={{ ...glass, padding: "24px 28px" }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Late tracker</div>
                <div style={{ fontSize: 13, color: "#6f6a85", marginBottom: 14 }}>3 lates in a month = 1 day salary cut</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Employees <span style={{ fontSize: 16, color: "#a29dbb", fontWeight: 600 }}>· {emps.length} total</span></div>
            <div style={{ ...glass, borderRadius: 20, boxShadow: "0 12px 40px rgba(109,90,230,0.10)", padding: "16px 20px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input placeholder="Full name" value={neName} onChange={(e) => setNeName(e.target.value)} style={{ flex: 1.2, minWidth: 150, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
              <input placeholder="Department" value={neDept} onChange={(e) => setNeDept(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
              <input placeholder="Role" value={neRole} onChange={(e) => setNeRole(e.target.value)} style={{ flex: 1, minWidth: 120, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 13.5, outline: "none" }} />
              <button onClick={addEmp} style={{ padding: "11px 22px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(109,90,230,0.3)" }}>+ Add employee</button>
            </div>
            <div style={{ ...glass, padding: "22px 26px" }}>
              <input placeholder="Search by name or department…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", marginBottom: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1.3fr 1fr 0.9fr 0.7fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>NAME</div><div>DEPARTMENT</div><div>ROLE</div><div>TODAY</div><div>LATES</div><div></div>
              </div>
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {empRows.map((e) => (
                  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1.3fr 1fr 0.9fr 0.7fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: e.avBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{e.initials}</div>
                      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                    </div>
                    <div style={{ color: "#57506e" }}>{e.dept}</div>
                    <div style={{ color: "#57506e" }}>{e.role}</div>
                    <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: e.pillBg, color: e.pillColor }}>{e.today}</span></div>
                    <div style={{ fontWeight: 700, color: e.lateColor }}>{e.lates}</div>
                    <button onClick={e.remove} style={{ padding: "6px 12px", border: "1px solid rgba(226,85,123,0.3)", borderRadius: 10, background: "transparent", color: "#b13a60", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "rep" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Monthly report <span style={{ fontSize: 16, color: "#a29dbb", fontWeight: 600 }}>· July 2026</span></div>
              <button style={{ padding: "11px 20px", border: "1px solid rgba(109,90,230,0.25)", borderRadius: 12, background: "rgba(255,255,255,0.6)", color: "#5a48c9", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Export CSV</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <div style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#147a58" }}>AVG ATTENDANCE</div>
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{avgAttendance}</div>
              </div>
              <div style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#a8641a" }}>TOTAL LATES</div>
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{totalLates}</div>
              </div>
              <div style={{ ...glass, borderRadius: 20, padding: "20px 24px", boxShadow: "0 12px 40px rgba(109,90,230,0.10)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#b13a60" }}>SALARY-CUT DAYS</div>
                <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{totalCuts}</div>
              </div>
            </div>
            <div style={{ ...glass, padding: "22px 26px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", gap: "0 12px", fontSize: 12, fontWeight: 700, color: "#a29dbb", letterSpacing: "0.6px", padding: "0 10px 10px", borderBottom: "1px solid rgba(109,90,230,0.12)" }}>
                <div>EMPLOYEE</div><div>DEPARTMENT</div><div>PRESENT</div><div>LATE</div><div>ABSENT</div><div>LEAVE</div><div>DEDUCTION</div>
              </div>
              <div style={{ maxHeight: 560, overflowY: "auto" }}>
                {reportRows.map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", gap: "0 12px", alignItems: "center", padding: "11px 10px", borderBottom: "1px solid rgba(109,90,230,0.07)", fontSize: 13.5, background: r.rowBg, borderRadius: 10 }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: "#57506e" }}>{r.dept}</div>
                    <div style={{ fontWeight: 600, color: "#147a58" }}>{r.present}</div>
                    <div style={{ fontWeight: 700, color: r.lateColor }}>{r.late}</div>
                    <div style={{ color: "#57506e" }}>{r.absent}</div>
                    <div style={{ color: "#57506e" }}>{r.leave}</div>
                    <div style={{ fontWeight: 700, color: r.cutColor }}>{r.cut}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "not" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease" }}>
            <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Notice board</div>
            <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 22, alignItems: "start" }}>
              <div style={{ ...glass, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: sora, fontWeight: 700, fontSize: 17 }}>Send a notice</div>
                <input placeholder="Notice title" value={ntTitle} onChange={(e) => setNtTitle(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none" }} />
                <textarea placeholder="Write your message to all employees…" value={ntBody} onChange={(e) => setNtBody(e.target.value)} rows={5} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none", resize: "vertical" }}></textarea>
                <select value={ntPriority} onChange={(e) => setNtPriority(e.target.value)} style={{ padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14, outline: "none" }}>
                  <option>Normal</option><option>Important</option><option>Urgent</option>
                </select>
                <button onClick={sendNotice} style={{ padding: 14, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(109,90,230,0.3)" }}>Publish to all employees</button>
                {ntSent && (
                  <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)", color: "#147a58", fontSize: 13, fontWeight: 600 }}>Notice published — visible on every employee portal.</div>
                )}
              </div>
              <div style={{ ...glass, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
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
            <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Leave requests <span style={{ fontSize: 16, color: "#a29dbb", fontWeight: 600 }}>· {leaves.filter((l) => l.status === "Pending").length} pending</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {leaveRows.map((l) => (
                <div key={l.id} style={{ ...glass, borderRadius: 20, boxShadow: "0 10px 32px rgba(109,90,230,0.10)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: l.avBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>{l.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name} <span style={{ fontWeight: 600, color: "#6f6a85", fontSize: 13.5 }}>· {l.type}</span></div>
                    <div style={{ fontSize: 13, color: "#6f6a85", marginTop: 3 }}>{l.range} — &quot;{l.reason}&quot;</div>
                  </div>
                  {l.pending && (
                    <div style={{ display: "flex", gap: 10 }}>
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
            <div style={{ fontFamily: sora, fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>Attendance settings</div>
            <div style={{ ...glass, padding: "28px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#57506e" }}>Office IP address (attendance allowed only from this IP)</label>
                <input value={stIP} onChange={(e) => setStIP(e.target.value)} style={{ padding: "13px 16px", borderRadius: 13, border: "1px solid rgba(109,90,230,0.18)", background: "rgba(255,255,255,0.7)", fontSize: 14.5, outline: "none", fontWeight: 600 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
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
                Rule preview: check-in after <b>{fmtLateAfter()}</b> is marked <b>Late</b>. Every <b>{stCut} lates</b> in a month deducts <b>1 day</b> of salary. Attendance is only accepted from IP <b>{stIP}</b>.
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: "#57506e" }}>
                <input type="checkbox" checked={onOfficeNetwork} onChange={(e) => setOnOfficeNetwork(e.target.checked)} />
                Simulate: employee device is on office network
              </label>
              <button onClick={saveSettings} style={{ padding: 14, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#6d5ae6,#8b74f0)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(109,90,230,0.3)", alignSelf: "flex-start", paddingLeft: 32, paddingRight: 32 }}>Save settings</button>
              {saved && (
                <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(31,169,122,0.10)", border: "1px solid rgba(31,169,122,0.25)", color: "#147a58", fontSize: 13, fontWeight: 600 }}>Settings saved.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
