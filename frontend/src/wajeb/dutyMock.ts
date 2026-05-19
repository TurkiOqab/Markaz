// Static phase-1 duty data for the Wajeb (duty officer) welcome page. There is
// NO backend for this role (frontend-only gate, same as Rabea). A future API /
// Rabea control panel will supply: the guidance message, the handover group,
// the surprise-visit assignment, the alert level, and the incident feed.

import { today } from "../lib/clock";

export type AlertLevel = "normal" | "elevated" | "critical";

export interface DutyData {
  /** Rendered as "واجب {dutyNumber}". */
  dutyNumber: string;
  officerName: string;
  alertLevel: AlertLevel;
  notificationCount: number;

  // Shift is anchored to the *current* day so the counter ticks live:
  // started today 15:28 (٣:٢٨ م), ends next day 08:00 (٨:٠٠ ص).
  shiftStart: Date;
  shiftEnd: Date;

  // Default guidance under the officer name. Rabea will be able to override
  // this with a private message in a later phase; until then the default
  // stands. This constant is the single injection point for that future wiring.
  guidance: string;

  incidents: {
    count: number;
    /** 7 mini-bar heights (%) — indexes in `peak` render in solid gold. */
    trend: number[];
    peak: number[];
  };

  surpriseVisit: {
    centerName: string;
    managerName: string;
  };

  // Read-only: set by Rabea, shown to the officer for information only.
  handover: {
    documenter: string;
    supervision: string[];
  };
}

export const DEFAULT_GUIDANCE =
  "تبدأ مهمتك اليوم بزيارة ميدانية واحدة مُسندة إليك، مع متابعة الحوادث. موضحة لك تفاصيل الاستلام على اليسار.";

function at(base: Date, addDays: number, h: number, m: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  return d;
}

export function getDutyMock(): DutyData {
  const base = today();
  return {
    dutyNumber: "١",
    officerName: "الملازم خالد العتيبي",
    alertLevel: "normal",
    notificationCount: 2,

    shiftStart: at(base, 0, 15, 28),
    shiftEnd: at(base, 1, 8, 0),

    guidance: DEFAULT_GUIDANCE,

    incidents: {
      count: 3,
      trend: [20, 40, 30, 75, 45, 90, 35],
      peak: [3, 5],
    },

    surpriseVisit: {
      centerName: "مركز م1",
      managerName: "عبدالله الشهري",
    },

    handover: {
      documenter: "الرقيب أول محمد العتيبي",
      supervision: ["الرائد فهد القحطاني", "النقيب سعد الشمري"],
    },
  };
}
