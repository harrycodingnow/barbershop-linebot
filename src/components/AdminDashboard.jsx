import { useEffect, useMemo, useState } from "react";
import { formatDateLabel } from "../utils/date";
import {
  readSalonData,
  resetSalonData,
  strikeUserForBooking,
  updateBookingStatus
} from "../utils/storage";

const statusStyleMap = {
  booked: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  noshow: "bg-rose-100 text-rose-800"
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
    <section className="space-y-5">
      <header className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">💻 老闆後台 Dashboard</h2>
        <p className="text-sm text-slate-600">顯示所有日期預約紀錄</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleClearLocalStorage}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            Developer: Clear localStorage
          </button>
        </div>
      </header>

      {devMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {devMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">總預約</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{allBookings.length}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-600">已到店</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{completedCount}</p>
        </article>
        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-600">未到店</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{noShowCount}</p>
        </article>
      </div>

      <p className="text-sm text-slate-500">待處理筆數：{bookedCount}</p>

      <div className="space-y-3">
        {allBookings.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            目前尚無任何預約紀錄。
          </p>
        )}

        {dates.map((date) => (
          <section key={date} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">{formatDateLabel(date)}</h3>

            {groupedByDate[date].map((booking) => {
              const user = users[booking.lineUserId];
              const isPending = booking.status === "booked";
              const isBlacklisted = Boolean(user?.isBlacklisted);

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-slate-900">
                        {booking.timeSlot} - {booking.displayName}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusStyleMap[booking.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabelMap[booking.status] || booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                        {booking.type === "walk-in" ? "現場預約" : "線上預約"}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                        {booking.isDepositPaid ? "已付訂金" : "未付訂金"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    LINE ID: {booking.lineUserId}{" "}
                    {isBlacklisted && (
                      <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                        黑名單
                      </span>
                    )}
                  </div>

                  {user?.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      備註：{user.notes}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={!isPending}
                      onClick={() => handleCheckIn(booking.id)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isPending
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      ✅ 已到 (Check-in)
                    </button>
                    <button
                      type="button"
                      disabled={!isPending}
                      onClick={() => handleStrike(booking.id)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isPending
                          ? "bg-rose-600 text-white hover:bg-rose-500"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      🚫 未到 / 黑名單
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}

export default AdminDashboard;
