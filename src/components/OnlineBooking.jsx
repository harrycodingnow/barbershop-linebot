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
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

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
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="mono-rule" />
        <h2 className="text-4xl md:text-5xl">線上預約</h2>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
          Tomorrow And Later / Today Locked
        </p>
      </header>

      <Card className="editorial-grid space-y-5">
        <div className="flex flex-col items-center gap-3 border-b border-black pb-4 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-lg">選擇預約日期</p>
          <Badge variant="muted">Today Locked</Badge>
        </div>

        <p className="text-center text-sm text-neutral-700 md:text-left">
          今天（{formatDateLabel(today)}）不可線上預約，請選擇明天以後日期。
        </p>

        <label className="block text-center text-xs font-mono uppercase tracking-[0.12em] text-neutral-600 md:text-left">
          Booking Date
        </label>
        <div className="flex justify-center md:justify-start">
          <input
            type="date"
            min={tomorrow}
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setSelectedSlot("");
            }}
            className="w-[18rem] max-w-full border-2 border-black bg-white px-3 py-3 text-center font-mono text-sm focus:border-[3px] focus:outline-none"
          />
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
          <p className="text-lg">可預約時段</p>
          <Badge>{formatDateLabel(selectedDate)}</Badge>
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
          Select One Time Slot
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {availableSlots.length === 0 && (
            <p className="col-span-full border border-black px-4 py-6 text-center text-sm text-neutral-700">
              此日期已無可預約時段。
            </p>
          )}

          {availableSlots.map((slot) => {
            const isActive = selectedSlot === slot;
            return (
              <Button
                key={slot}
                variant={isActive ? "selected" : "outline"}
                onClick={() => setSelectedSlot(slot)}
                className="w-full font-mono text-sm"
              >
                {slot}
              </Button>
            );
          })}
        </div>
      </Card>

      {feedback && (
        <Card inverted>
          <p className="font-mono text-sm uppercase tracking-[0.08em]">{feedback}</p>
        </Card>
      )}

      <Button onClick={handleOpenPayment} className="w-full md:w-auto md:min-w-[260px]">
        前往模擬付款
      </Button>

      {openPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border-4 border-black bg-white p-6">
            <h3 className="text-3xl">模擬金流確認</h3>
            <p className="mt-4 text-sm text-neutral-700">
              訂單：{formatDateLabel(selectedDate)} {selectedSlot}
            </p>
            <p className="mt-1 text-sm text-neutral-700">訂金：NT$100（Demo 模擬）</p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => setOpenPaymentModal(false)}
                className="w-full"
              >
                取消
              </Button>
              <Button onClick={handleMockPayment} className="w-full">
                模擬付款
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OnlineBooking;
