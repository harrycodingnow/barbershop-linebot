import { useEffect, useMemo, useState } from "react";
import {
  formatDateLabel,
  getTodayDateString,
  getTomorrowDateString
} from "../utils/date";
import {
  TIME_SLOTS,
  createBooking,
  getTakenSlotsByDate
} from "../utils/storage";

function OnlineBooking({ currentUser }) {
  const today = useMemo(() => getTodayDateString(), []);
  const tomorrow = useMemo(() => getTomorrowDateString(), []);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [feedback, setFeedback] = useState("");
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const refreshSlots = (targetDate) => {
    if (!targetDate) return;
    const taken = new Set(getTakenSlotsByDate(targetDate));
    setAvailableSlots(TIME_SLOTS.filter((slot) => !taken.has(slot)));
  };

  useEffect(() => {
    refreshSlots(selectedDate);
  }, [selectedDate]);

  const handleOpenPayment = () => {
    if (!selectedDate || !selectedSlot) {
      setFeedback("請先選擇日期與時段。");
      return;
    }
    if (selectedDate <= today) {
      setFeedback("線上預約僅開放明天之後的日期。");
      return;
    }
    setFeedback("");
    setOpenPaymentModal(true);
  };

  const handleMockPayment = () => {
    createBooking({
      type: "online",
      date: selectedDate,
      timeSlot: selectedSlot,
      lineUserId: currentUser.lineUserId,
      displayName: currentUser.displayName,
      isDepositPaid: true
    });
    setOpenPaymentModal(false);
    setFeedback(`付款成功，已預約 ${formatDateLabel(selectedDate)} ${selectedSlot}`);
    setSelectedSlot("");
    refreshSlots(selectedDate);
  };

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">🔵 線上預約</h2>
        <p className="mt-1 text-sm text-slate-600">
          今天（{formatDateLabel(today)}）為鎖定日期，無法線上預約。
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3">
          <button
            type="button"
            disabled
            className="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
          >
            今天 {formatDateLabel(today)}（已鎖定）
          </button>
        </div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          選擇日期（明天起）
        </label>
        <input
          type="date"
          min={tomorrow}
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setSelectedSlot("");
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 transition focus:ring"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">
          可預約時段（{formatDateLabel(selectedDate)}）
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {availableSlots.length === 0 && (
            <p className="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
              此日期已無可預約時段。
            </p>
          )}

          {availableSlots.map((slot) => {
            const isActive = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-amber-500 bg-amber-100 text-amber-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {feedback}
        </div>
      )}

      <button
        type="button"
        onClick={handleOpenPayment}
        className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-500"
      >
        前往模擬付款
      </button>

      {openPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">模擬金流確認</h3>
            <p className="mt-2 text-sm text-slate-600">
              訂單：{formatDateLabel(selectedDate)} {selectedSlot}
            </p>
            <p className="mt-1 text-sm text-slate-600">訂金：NT$300（Demo 模擬）</p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpenPaymentModal(false)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleMockPayment}
                className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                模擬付款
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OnlineBooking;
