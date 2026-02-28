import { useEffect, useMemo, useState } from "react";
import { formatDateLabel, getTodayDateString } from "../utils/date";
import {
  TIME_SLOTS,
  createBooking,
  getTakenSlotsByDate,
  readSalonData
} from "../utils/storage";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

function WalkInBooking({ currentUser }) {
  const today = useMemo(() => getTodayDateString(), []);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistNotes, setBlacklistNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [existingBooking, setExistingBooking] = useState(null);
  const [feedback, setFeedback] = useState("");

  const refreshState = () => {
    const data = readSalonData();
    const userProfile = data.users[currentUser.lineUserId];
    const takenSlots = new Set(getTakenSlotsByDate(today));
    const todayWalkInBooking =
      data.bookings.find(
        (booking) =>
          booking.type === "walk-in" &&
          booking.date === today &&
          booking.lineUserId === currentUser.lineUserId
      ) || null;

    setIsBlacklisted(Boolean(userProfile?.isBlacklisted));
    setBlacklistNotes(userProfile?.notes || "");
    setExistingBooking(todayWalkInBooking);
    setSelectedSlot((prev) => prev || todayWalkInBooking?.timeSlot || "");
    setAvailableSlots(TIME_SLOTS.filter((slot) => !takenSlots.has(slot)));
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleWalkInBooking = () => {
    if (!selectedSlot) {
      setFeedback("請先選擇一個時段。");
      return;
    }
    if (isBlacklisted) return;
    if (existingBooking) {
      setFeedback("你今天已完成一筆現場預約，無法再次預約。");
      return;
    }

    const confirmed = window.confirm(
      `確認預約 ${formatDateLabel(today)} ${selectedSlot} 嗎？`
    );
    if (!confirmed) return;

    createBooking({
      type: "walk-in",
      date: today,
      timeSlot: selectedSlot,
      lineUserId: currentUser.lineUserId,
      displayName: currentUser.displayName,
      isDepositPaid: false
    });

    setFeedback(`已完成現場預約：${formatDateLabel(today)} ${selectedSlot}`);
    refreshState();
  };

  if (isBlacklisted) {
    return (
      <section className="space-y-6">
        <div className="mono-rule" />
        <Card className="border-4">
          <h2 className="text-4xl md:text-5xl">現場預約已停用</h2>
          <p className="mt-4 text-base text-neutral-700">
            你的帳號目前無法進行預約，請聯繫店家處理名單狀態。
          </p>
          {blacklistNotes && (
            <p className="mt-5 border-t border-black pt-4 font-mono text-xs tracking-[0.08em] text-neutral-700">
              NOTES: {blacklistNotes}
            </p>
          )}
        </Card>
        {blacklistNotes && (
          <Badge variant="muted">Booking Access: Blocked</Badge>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="mono-rule" />
        <h2 className="text-4xl md:text-5xl">現場預約</h2>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
          Today Only / {formatDateLabel(today)}
        </p>
      </header>

      {feedback && (
        <Card inverted>
          <p className="font-mono text-sm uppercase tracking-[0.08em]">{feedback}</p>
        </Card>
      )}

      <Card className="editorial-grid space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-black pb-4">
          <p className="text-lg">可預約時段</p>
          <Badge>{availableSlots.length} Slots</Badge>
        </div>

        {existingBooking && (
          <p className="border border-black px-4 py-3 text-sm text-neutral-700">
            你今天已預約 {existingBooking.timeSlot}，每位使用者在現場預約只能預約一個時段。
          </p>
        )}

        {availableSlots.length === 0 && (
          <p className="border border-black px-4 py-6 text-center text-sm text-neutral-700">
            今天已無可預約時段。
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {availableSlots.map((slot) => {
            const isActive = selectedSlot === slot;
            return (
              <Button
                key={slot}
                variant={isActive ? "selected" : "outline"}
                onClick={() => {
                  if (existingBooking) return;
                  setSelectedSlot(slot);
                  setFeedback("");
                }}
                aria-pressed={isActive}
                disabled={Boolean(existingBooking)}
                className={`w-full font-mono text-sm ${
                  isActive ? "" : "hover:bg-neutral-100 hover:text-black"
                }`}
              >
                {slot}
              </Button>
            );
          })}
        </div>

        <div className="border-t border-black pt-4">
          <Button
            onClick={handleWalkInBooking}
            disabled={!selectedSlot || Boolean(existingBooking)}
            className="w-full md:w-auto md:min-w-[240px]"
          >
            確認現場預約
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default WalkInBooking;
