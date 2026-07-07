-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "officeIP" TEXT NOT NULL DEFAULT '192.168.10.1',
    "shiftStart" TEXT NOT NULL DEFAULT '09:00',
    "graceMinutes" INTEGER NOT NULL DEFAULT 5,
    "latesPerCut" INTEGER NOT NULL DEFAULT 3
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInAt" DATETIME,
    "checkOutAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABSENT',
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalWorkingHours" REAL,
    "breakMinutes" INTEGER,
    "branch" TEXT,
    "remarks" TEXT,
    "batchAssigned" TEXT,
    "classesTaken" INTEGER,
    "studentsPresent" INTEGER,
    "studentsAbsent" INTEGER,
    "selfMarked" BOOLEAN NOT NULL DEFAULT true,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("checkInAt", "checkOutAt", "createdAt", "date", "id", "status", "userId") SELECT "checkInAt", "checkOutAt", "createdAt", "date", "id", "status", "userId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "employeeCode" TEXT,
    "department" TEXT NOT NULL DEFAULT 'General',
    "jobTitle" TEXT NOT NULL DEFAULT 'Staff',
    "branch" TEXT NOT NULL DEFAULT 'Main Campus',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "email", "id", "jobTitle", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "department", "email", "id", "jobTitle", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
