import { useEffect, useMemo, useState } from "react";
import { formatDateLabel, getTodayDateString } from "../utils/date";
import {
  TIME_SLOTS,
  createBooking,
  getTakenSlotsByDate,
  readSalonData
} from "../utils/storage";

function WalkInBooking({ currentUser }) {
  const today = useMemo(() => getTodayDateString(), []);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistNotes, setBlacklistNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [feedback, setFeedback] = useState("");

  const refreshState = () => {
    const data = readSalonData();
    const userProfile = data.users[currentUser.lineUserId];
    const takenSlots = new Set(getTakenSlotsByDate(today));

    setIsBlacklisted(Boolean(userProfile?.isBlacklisted));
    setBlacklistNotes(userProfile?.notes || "");
    setAvailableSlots(TIME_SLOTS.filter((slot) => !takenSlots.has(slot)));
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleWalkInBooking = (timeSlot) => {
    if (isBlacklisted) return;

    createBooking({
      type: "walk-in",
      date: today,
      timeSlot,
      lineUserId: currentUser.lineUserId,
      displayName: currentUser.displayName,
      isDepositPaid: false
    });

    setFeedback(`已完成現場預約：${formatDateLabel(today)} ${timeSlot}`);
    refreshState();
  };

  if (isBlacklisted) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="mb-2 text-xl font-bold text-rose-800">現場預約（已封鎖）</h2>
        <p className="text-sm text-rose-700">
          你目前已被加入黑名單，無法進行任何預約。請聯繫店家處理。
        </p>
        {blacklistNotes && (
          <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-rose-700">
            備註：{blacklistNotes}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">🟢 現場預約</h2>
        <p className="mt-1 text-sm text-slate-600">
          僅顯示今天可預約時段：{formatDateLabel(today)}
        </p>
      </header>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {availableSlots.length === 0 && (
          <p className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            今天已無可預約時段。
          </p>
        )}

        {availableSlots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => handleWalkInBooking(slot)}
            className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-3 text-center text-sm font-semibold text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-100"
          >
            {slot}
          </button>
        ))}
      </div>
    </section>
  );
}

export default WalkInBooking;
