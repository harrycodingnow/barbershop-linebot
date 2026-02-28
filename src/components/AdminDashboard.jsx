import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateLabel, getTodayDateString } from "../utils/date";
import {
  readSalonData,
  resetSalonData,
  setUserBlacklist,
  strikeUserForBooking,
  updateBookingStatus,
  updateUserNotes
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

const ADMIN_TABS = [
  { key: "schedule", label: "排程" },
  { key: "blacklist", label: "黑名單" }
];

const getLatestBookingDate = (bookings) =>
  bookings.reduce(
    (latestDate, booking) => (booking.date > latestDate ? booking.date : latestDate),
    ""
  );

function AdminDashboard() {
  const today = useMemo(() => getTodayDateString(), []);
  const [allBookings, setAllBookings] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState("schedule");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [devMessage, setDevMessage] = useState("");

  const refreshState = useCallback(
    ({ resetDate = false } = {}) => {
      const data = readSalonData();
      const sortedBookings = [...(data.bookings ?? [])].sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return a.timeSlot.localeCompare(b.timeSlot);
      });

      const latestDate = getLatestBookingDate(sortedBookings);
      setUsers(data.users ?? {});
      setAllBookings(sortedBookings);
      setNoteDrafts({});
      setSelectedDate((prevDate) => {
        if (resetDate) return latestDate || today;
        return prevDate || latestDate || today;
      });
    },
    [today]
  );

  useEffect(() => {
    refreshState({ resetDate: true });
  }, [refreshState]);

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
    refreshState({ resetDate: true });
    setDevMessage("Developer: localStorage salon_data 已清空並重置。");
  };

  const handleSaveUserNotes = (lineUserId) => {
    const nextNotes = noteDrafts[lineUserId] ?? users[lineUserId]?.notes ?? "";
    updateUserNotes(lineUserId, nextNotes);
    refreshState();
    setDevMessage("黑名單備註已儲存。");
  };

  const handleUnblacklist = (lineUserId) => {
    setUserBlacklist(lineUserId, false);
    refreshState();
    setDevMessage("使用者已解除黑名單。");
  };

  const selectedDateBookings = useMemo(
    () => allBookings.filter((booking) => booking.date === selectedDate),
    [allBookings, selectedDate]
  );

  const scheduleSummary = useMemo(() => {
    const summary = {
      total: selectedDateBookings.length,
      pending: 0,
      completed: 0,
      noShow: 0
    };

    selectedDateBookings.forEach((booking) => {
      if (booking.status === "completed") summary.completed += 1;
      else if (booking.status === "noshow") summary.noShow += 1;
      else summary.pending += 1;
    });

    return summary;
  }, [selectedDateBookings]);

  const blacklistedUsers = useMemo(
    () =>
      Object.entries(users)
        .filter(([, user]) => Boolean(user?.isBlacklisted))
        .sort(([, userA], [, userB]) =>
          (userA?.displayName || "未知客人").localeCompare(
            userB?.displayName || "未知客人",
            "zh-Hant"
          )
        ),
    [users]
  );

  const selectedDateLabel = selectedDate ? formatDateLabel(selectedDate) : "未選擇日期";

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="mono-rule" />
        <h2 className="text-4xl md:text-5xl">管理後台</h2>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
          Schedule + Blacklist Manager
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap gap-2" aria-label="Admin Tabs">
            {ADMIN_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "primary" : "outline"}
                onClick={() => {
                  setActiveTab(tab.key);
                  setDevMessage("");
                }}
                className="min-h-9 px-4 py-2 text-[11px] tracking-[0.08em]"
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          <Button variant="outline" onClick={handleClearLocalStorage}>
            Developer: Clear Local Storage
          </Button>
        </div>
      </header>

      {devMessage && (
        <Card className="py-4">
          <p className="font-mono text-xs tracking-[0.08em] text-neutral-700">{devMessage}</p>
        </Card>
      )}

      {activeTab === "schedule" && (
        <section className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
              <p className="text-lg">排程日期</p>
              <Badge>{selectedDateLabel}</Badge>
            </div>
            <label className="font-mono text-xs uppercase tracking-[0.1em] text-neutral-600">
              Date Picker
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setDevMessage("");
              }}
              className="w-full border-2 border-black bg-white px-3 py-3 font-mono text-sm focus:border-[3px] focus:outline-none md:max-w-[280px]"
            />
          </Card>

          <Card className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-600">
              Summary / {selectedDateLabel}
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="border border-black p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                  總數
                </p>
                <p className="mt-1 text-2xl md:text-3xl">{scheduleSummary.total}</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                  待到店
                </p>
                <p className="mt-1 text-2xl md:text-3xl">{scheduleSummary.pending}</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                  已到
                </p>
                <p className="mt-1 text-2xl md:text-3xl">{scheduleSummary.completed}</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                  未到
                </p>
                <p className="mt-1 text-2xl md:text-3xl">{scheduleSummary.noShow}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
              <h3 className="text-2xl md:text-3xl">當日預約排程</h3>
              <Badge>{selectedDateBookings.length} 筆</Badge>
            </div>

            {selectedDateBookings.length === 0 ? (
              <p className="border border-black px-4 py-6 text-center text-sm text-neutral-700">
                此日期尚無預約。
              </p>
            ) : (
              <div className="overflow-x-auto border border-black">
                <table className="min-w-[980px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="border-b border-r border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        時段
                      </th>
                      <th className="border-b border-r border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        客人
                      </th>
                      <th className="border-b border-r border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        狀態
                      </th>
                      <th className="border-b border-r border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        預約類型
                      </th>
                      <th className="border-b border-r border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        訂金
                      </th>
                      <th className="border-b border-black px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em]">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDateBookings.map((booking) => {
                      const user = users[booking.lineUserId];
                      const isPending = booking.status === "booked";
                      const isBlacklisted = Boolean(user?.isBlacklisted);

                      return (
                        <tr key={booking.id}>
                          <td className="border-b border-r border-black px-3 py-2 align-top font-mono">
                            {booking.timeSlot}
                          </td>
                          <td className="border-b border-r border-black px-3 py-2 align-top">
                            <p className="font-medium">{booking.displayName || "未知客人"}</p>
                            <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-neutral-600">
                              {booking.lineUserId}
                            </p>
                            {user?.notes && (
                              <p className="mt-2 border border-neutral-300 px-2 py-1 whitespace-pre-line font-mono text-[11px] text-neutral-600">
                                NOTES: {user.notes}
                              </p>
                            )}
                          </td>
                          <td className="border-b border-r border-black px-3 py-2 align-top">
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant={statusVariantMap[booking.status]}>
                                {statusLabelMap[booking.status] || booking.status}
                              </Badge>
                              {isBlacklisted && (
                                <Badge variant="muted" className="w-fit">
                                  黑名單
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-r border-black px-3 py-2 align-top">
                            <Badge variant={booking.type === "online" ? "inverted" : "default"}>
                              {booking.type === "walk-in" ? "現場預約" : "線上預約"}
                            </Badge>
                          </td>
                          <td className="border-b border-r border-black px-3 py-2 align-top">
                            <Badge variant={booking.isDepositPaid ? "inverted" : "muted"}>
                              {booking.isDepositPaid ? "已付訂金" : "未付訂金"}
                            </Badge>
                          </td>
                          <td className="border-b border-black px-3 py-2 align-top">
                            <div className="flex min-w-[170px] flex-col gap-2">
                              <Button
                                disabled={!isPending}
                                onClick={() => handleCheckIn(booking.id)}
                                className="min-h-9 px-3 py-2 text-[11px] tracking-[0.08em]"
                              >
                                已到 Check In
                              </Button>
                              <Button
                                variant="outline"
                                disabled={!isPending}
                                onClick={() => handleStrike(booking.id)}
                                className="min-h-9 px-3 py-2 text-[11px] tracking-[0.08em]"
                              >
                                未到 / 黑名單
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      )}

      {activeTab === "blacklist" && (
        <section className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
              <h3 className="text-2xl md:text-3xl">黑名單管理</h3>
              <Badge>{blacklistedUsers.length} Users</Badge>
            </div>

            {blacklistedUsers.length === 0 ? (
              <p className="border border-black px-4 py-6 text-center text-sm text-neutral-700">
                目前無黑名單使用者。
              </p>
            ) : (
              <div className="space-y-3">
                {blacklistedUsers.map(([lineUserId, user]) => {
                  const displayName = user?.displayName || "未知客人";
                  const notes = noteDrafts[lineUserId] ?? user?.notes ?? "";

                  return (
                    <section key={lineUserId} className="space-y-3 border border-black p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg">{displayName}</p>
                          <p className="font-mono text-xs uppercase tracking-[0.08em] text-neutral-600">
                            LINE ID: {lineUserId}
                          </p>
                        </div>
                        <Badge variant="muted">黑名單使用者</Badge>
                      </div>

                      <label className="block font-mono text-xs uppercase tracking-[0.08em] text-neutral-600">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(event) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [lineUserId]: event.target.value
                          }))
                        }
                        rows={3}
                        className="w-full border-2 border-black bg-white px-3 py-2 text-sm focus:border-[3px] focus:outline-none"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleSaveUserNotes(lineUserId)}
                          className="min-h-9 px-4 py-2 text-[11px] tracking-[0.08em]"
                        >
                          儲存備註
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUnblacklist(lineUserId)}
                          className="min-h-9 px-4 py-2 text-[11px] tracking-[0.08em]"
                        >
                          解除黑名單
                        </Button>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </Card>
        </section>
      )}
    </section>
  );
}

export default AdminDashboard;
