import { useEffect, useMemo, useState } from "react";
import { formatDateLabel } from "../utils/date";
import {
  readSalonData,
  resetSalonData,
  strikeUserForBooking,
  updateBookingStatus
} from "../utils/storage";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const statusVariantMap = {
  booked: "default",
  completed: "inverted",
  noshow: "muted"
};

const statusLabelMap = {
  booked: "待到店",
  completed: "已到",
  noshow: "未到"
};

function AdminDashboard() {
  const [allBookings, setAllBookings] = useState([]);
  const [users, setUsers] = useState({});
  const [devMessage, setDevMessage] = useState("");

  const refreshState = () => {
    const data = readSalonData();
    setUsers(data.users ?? {});

    const sortedBookings = [...(data.bookings ?? [])].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    setAllBookings(sortedBookings);
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleCheckIn = (bookingId) => {
    updateBookingStatus(bookingId, "completed");
    refreshState();
  };

  const handleStrike = (bookingId) => {
    const targetBooking = allBookings.find((booking) => booking.id === bookingId);
    const note = targetBooking
      ? `未到店（${targetBooking.date} ${targetBooking.timeSlot}）`
      : "未到店，已列入黑名單";

    strikeUserForBooking(bookingId, note);
    refreshState();
  };

  const handleClearLocalStorage = () => {
    const confirmed = window.confirm(
      "確定要清除本機所有 Demo 資料嗎？此動作會刪除全部預約與客戶狀態。"
    );
    if (!confirmed) return;

    resetSalonData();
    refreshState();
    setDevMessage("Developer: localStorage salon_data 已清空並重置。");
  };

  const groupedByDate = useMemo(() => {
    return allBookings.reduce((acc, booking) => {
      if (!acc[booking.date]) acc[booking.date] = [];
      acc[booking.date].push(booking);
      return acc;
    }, {});
  }, [allBookings]);

  const dates = useMemo(() => Object.keys(groupedByDate).sort(), [groupedByDate]);

  const bookedCount = allBookings.filter((item) => item.status === "booked").length;
  const completedCount = allBookings.filter(
    (item) => item.status === "completed"
  ).length;
  const noShowCount = allBookings.filter((item) => item.status === "noshow").length;

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="mono-rule" />
        <h2 className="text-4xl md:text-5xl">管理後台</h2>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
          All Dates Overview
        </p>
        <Button variant="outline" onClick={handleClearLocalStorage}>
          Developer: Clear Local Storage
        </Button>
      </header>

      {devMessage && (
        <Card>
          <p className="font-mono text-sm uppercase tracking-[0.08em]">{devMessage}</p>
        </Card>
      )}

      <Card inverted className="space-y-5">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/80">Summary</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="border border-white/70 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-white/80">Total</p>
            <p className="mt-2 text-5xl">{allBookings.length}</p>
          </div>
          <div className="border border-white/70 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-white/80">
              Completed
            </p>
            <p className="mt-2 text-5xl">{completedCount}</p>
          </div>
          <div className="border border-white/70 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-white/80">No Show</p>
            <p className="mt-2 text-5xl">{noShowCount}</p>
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-white/80">
          Pending: {bookedCount}
        </p>
      </Card>

      <div className="space-y-8">
        {allBookings.length === 0 && <Card className="text-center">目前尚無任何預約紀錄。</Card>}

        {dates.map((date) => (
          <section key={date} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
              <h3 className="text-3xl md:text-4xl">{formatDateLabel(date)}</h3>
              <Badge>{groupedByDate[date].length} Items</Badge>
            </div>

            {groupedByDate[date].map((booking) => {
              const user = users[booking.lineUserId];
              const isPending = booking.status === "booked";
              const isBlacklisted = Boolean(user?.isBlacklisted);

              return (
                <Card key={booking.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black pb-4">
                    <div className="flex items-center gap-2">
                      <p className="text-2xl md:text-3xl">{booking.timeSlot}</p>
                      <p className="pt-1 text-base text-neutral-700">{booking.displayName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariantMap[booking.status]}>
                        {statusLabelMap[booking.status] || booking.status}
                      </Badge>
                      <Badge variant={booking.type === "online" ? "inverted" : "default"}>
                        {booking.type === "walk-in" ? "現場預約" : "線上預約"}
                      </Badge>
                      <Badge variant={booking.isDepositPaid ? "inverted" : "muted"}>
                        {booking.isDepositPaid ? "已付訂金" : "未付訂金"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.08em] text-neutral-600">
                      LINE ID: {booking.lineUserId}
                    </p>
                    {isBlacklisted && (
                      <Badge variant="muted" className="w-fit">
                        黑名單使用者
                      </Badge>
                    )}
                  </div>

                  {user?.notes && (
                    <p className="border border-black px-3 py-2 font-mono text-xs tracking-[0.06em] text-neutral-700">
                      NOTES: {user.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Button
                      disabled={!isPending}
                      onClick={() => handleCheckIn(booking.id)}
                      className="w-full"
                    >
                      已到 Check In
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!isPending}
                      onClick={() => handleStrike(booking.id)}
                      className="w-full"
                    >
                      未到 / 黑名單
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}

export default AdminDashboard;
