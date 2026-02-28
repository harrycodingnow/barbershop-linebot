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

const SCHEDULE_START_HOUR = 12;
const SCHEDULE_END_HOUR = 21;

const getLatestBookingDate = (bookings) =>
  bookings.reduce(
    (latestDate, booking) => (booking.date > latestDate ? booking.date : latestDate),
    ""
  );

const getHourFromTimeSlot = (timeSlot) => {
  const hour = Number(String(timeSlot || "").split(":")[0]);
  return Number.isNaN(hour) ? null : hour;
};

const formatHourLabel = (hour24) => {
  if (hour24 === 12) return "下午12點";
  if (hour24 > 12) return `下午${hour24 - 12}點`;
  if (hour24 === 0) return "上午12點";
  return `上午${hour24}點`;
};

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

  const scheduleHours = useMemo(
    () =>
      Array.from(
        { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
        (_, index) => SCHEDULE_START_HOUR + index
      ),
    []
  );

  const bookingsByHour = useMemo(() => {
    return selectedDateBookings.reduce((acc, booking) => {
      const hour = getHourFromTimeSlot(booking.timeSlot);
      if (hour === null) return acc;
      if (hour < SCHEDULE_START_HOUR || hour > SCHEDULE_END_HOUR) return acc;

      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(booking);
      return acc;
    }, {});
  }, [selectedDateBookings]);

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

          <Card className="space-y-3 !p-4 md:space-y-4 md:!p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-700">
                Daily Summary
              </p>
              <Badge>{selectedDateLabel}</Badge>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-600">
              Focus: 待到店
            </p>

            <div className="grid grid-cols-1 border border-black md:grid-cols-12">
              <section className="border-b border-black bg-black p-3 text-white md:col-span-6 md:border-b-0 md:border-r md:p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/80">
                  待到店
                </p>
                <p className="mt-1 text-3xl leading-none md:mt-2 md:text-6xl">
                  {scheduleSummary.pending}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white/70 md:mt-3 md:text-[11px]">
                  需要處理
                </p>
              </section>

              <section className="md:col-span-6">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="border-b border-black p-3 md:border-b-0 md:border-r md:p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                      總數
                    </p>
                    <p className="mt-1 text-2xl leading-none md:mt-2 md:text-3xl">
                      {scheduleSummary.total}
                    </p>
                  </div>
                  <div className="border-b border-black p-3 md:border-b-0 md:border-r md:p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                      已到
                    </p>
                    <p className="mt-1 text-2xl leading-none md:mt-2 md:text-3xl">
                      {scheduleSummary.completed}
                    </p>
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
                      未到
                    </p>
                    <p className="mt-1 text-2xl leading-none md:mt-2 md:text-3xl">
                      {scheduleSummary.noShow}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
              <h3 className="text-2xl md:text-3xl">當日預約排程</h3>
              <Badge>{selectedDateBookings.length} 筆</Badge>
            </div>

            <div className="border border-black">
              {scheduleHours.map((hour) => {
                const rowBookings = bookingsByHour[hour] ?? [];
                return (
                  <section
                    key={hour}
                    className="grid min-h-[76px] grid-cols-[5.5rem_1fr] border-b border-black last:border-b-0"
                  >
                    <div className="border-r border-black px-2 py-3 font-mono text-xs tracking-[0.06em] text-neutral-700">
                      {formatHourLabel(hour)}
                    </div>

                    <div className="px-2 py-2 md:px-3">
                      {rowBookings.length === 0 ? (
                        <div className="h-full min-h-[56px]" />
                      ) : (
                        <div className="space-y-2">
                          {rowBookings.map((booking) => {
                            const user = users[booking.lineUserId];
                            const isPending = booking.status === "booked";
                            const isBlacklisted = Boolean(user?.isBlacklisted);
                            const isBooked = booking.status === "booked";

                            return (
                              <article
                                key={booking.id}
                                className={`border-2 border-black p-3 ${
                                  isBooked ? "bg-black text-white" : "bg-white text-black"
                                }`}
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-mono text-sm">{booking.timeSlot}</p>
                                      <p className="text-sm">{booking.displayName || "未知客人"}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={statusVariantMap[booking.status]}>
                                        {statusLabelMap[booking.status] || booking.status}
                                      </Badge>
                                      <Badge
                                        variant={booking.type === "online" ? "inverted" : "default"}
                                      >
                                        {booking.type === "walk-in" ? "現場預約" : "線上預約"}
                                      </Badge>
                                      <Badge
                                        variant={booking.isDepositPaid ? "inverted" : "muted"}
                                      >
                                        {booking.isDepositPaid ? "已付訂金" : "未付訂金"}
                                      </Badge>
                                      {isBlacklisted && (
                                        <Badge variant="muted" className="w-fit">
                                          黑名單
                                        </Badge>
                                      )}
                                    </div>

                                    {user?.notes && (
                                      <p
                                        className={`border px-2 py-1 whitespace-pre-line font-mono text-[11px] ${
                                          isBooked
                                            ? "border-white/70 text-white/85"
                                            : "border-neutral-300 text-neutral-700"
                                        }`}
                                      >
                                        NOTES: {user.notes}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex gap-2 md:flex-col">
                                    <Button
                                      variant="outline"
                                      disabled={!isPending}
                                      onClick={() => handleCheckIn(booking.id)}
                                      className={`min-h-8 px-3 py-2 text-[10px] tracking-[0.08em] ${
                                        isBooked
                                          ? "border-white bg-white text-black hover:bg-neutral-100 hover:text-black"
                                          : ""
                                      }`}
                                    >
                                      已到
                                    </Button>
                                    <Button
                                      variant="outline"
                                      disabled={!isPending}
                                      onClick={() => handleStrike(booking.id)}
                                      className={`min-h-8 px-3 py-2 text-[10px] tracking-[0.08em] ${
                                        isBooked
                                          ? "border-white bg-white text-black hover:bg-neutral-100 hover:text-black"
                                          : ""
                                      }`}
                                    >
                                      未到
                                    </Button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
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
