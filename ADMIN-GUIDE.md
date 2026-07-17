# Times Computers — Attendance Portal · Admin Setup Guide

## 1. Your portal

| | |
|---|---|
| **Portal URL** | https://timescomputer.networkingexperts.in |
| **Admin login** | `admin@timescomputers.com` |
| **First password** | `Admin@12345` |

> ⚠️ This password is a known default. There is currently no "change password"
> screen in the app — ask your developer to rotate it in the database, or have
> a change-password feature added.

## 2. First-time setup (do this once, ~5 minutes)

### Step 1 — Sign in
Open the portal URL, enter the admin email and password above.

### Step 2 — Configure attendance rules (Settings tab)
| Setting | What it means | Example |
|---|---|---|
| **Office IP address(es)** | Faculty can check in **only** from these IPs. Enter your office's public IP. The same WiFi can appear as an IPv4 *and* an IPv6 address — add both, comma-separated. CIDR ranges work too. | `49.36.202.50, 2405:201:5502:c32c::/64` |
| **Shift start** | Official start of the working day | `09:00` |
| **Grace (minutes)** | Check-ins up to this many minutes after shift start still count as on time | `5` |
| **Lates per salary cut** | Every N lates in a month = 1 day of salary deducted | `3` |

Click **Save settings**. These are stored in the database and enforced
server-side on every check-in.

> **How to find your office IP:** on an office computer, search Google for
> "what is my IP" — add the address it shows. If a faculty check-in is
> rejected, the error message shows the IP their device came from; add that
> to the list.

### Step 3 — Create faculty accounts (Faculty accounts tab)
For each staff member fill in: full name, email, a temporary password,
Faculty ID (e.g. `FAC-101`), department, designation, branch — and click
**+ Create account**. Give each person their email + temporary password.
Passwords are stored encrypted (bcrypt) — nobody can read them back.

Role field: **Faculty** for teachers/staff, **Admin** only for people who
should see this admin panel.

## 3. Daily use

- **Dashboard** — live check-ins as they happen, present/late/absent/on-leave
  counts for today, and the late tracker showing who is approaching a salary
  cut.
- **Monthly report** — per-faculty totals for the current month: present,
  late, absent, leave, hours worked, and computed salary deductions. Filter
  by name or department.
- **Faculty side:** each faculty member logs in on their own device or an
  office computer, presses **Check In** when they arrive (only works on the
  office network), and **Check Out** when leaving — the checkout form records
  batch, classes taken, students present/absent, break time, and remarks.
- Check-ins after *shift start + grace* are automatically marked **Late**.

## 4. Things to know

- **Notices and leave requests are temporary for now** — they live in the
  browser session only and reset on refresh. Attendance, accounts, and
  settings are permanently stored in the database.
- **Faculty can't check in?** 1) Confirm they're on office WiFi. 2) Read the
  IP shown in their error message. 3) Add that IP in Settings → Save.
- **Deleting a faculty account** removes their login (the Remove button in
  Faculty accounts). Their name stays in old attendance records.
- The portal works on phones — faculty can check in from a mobile browser as
  long as the phone is on the office WiFi.

## 5. Technical reference (for your developer)

- **Hosting:** Hostinger (account `u664178120`), addon site
  `timescomputer.networkingexperts.in`, Node.js/Next.js app
- **Database:** MySQL `u664178120_times` (local to the hosting server);
  credentials in the app's `.env`
- **DNS:** Cloudflare (nameservers `javier`/`sneh.ns.cloudflare.com`),
  record: `timescomputer` CNAME → `timescomputer.networkingexperts.in.cdn.hstgr.net`
- **Deploys:** upload a source archive via Hostinger's Node.js app deploy
  (build runs `prisma db push` + seed + `next build`)
- **Source code:** https://github.com/Owais-Bhat/Times-Computers
