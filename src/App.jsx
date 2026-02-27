import { useEffect, useMemo, useState } from "react";
import WalkInBooking from "./components/WalkInBooking";
import OnlineBooking from "./components/OnlineBooking";
import AdminDashboard from "./components/AdminDashboard";
import { initSalonData } from "./utils/storage";

const CURRENT_USER = {
  lineUserId: "user_123",
  displayName: "小明"
};

const VALID_VIEWS = new Set(["walk-in", "online", "calendar", "admin"]);

const getViewFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get("view");
  return VALID_VIEWS.has(rawView) ? rawView : "walk-in";
};

const NAV_ITEMS = [
  { key: "walk-in", label: "現場預約" },
  { key: "online", label: "線上預約" }
];

function App() {
  const [view, setView] = useState(getViewFromURL);

  useEffect(() => {
    initSalonData();
  }, []);

  useEffect(() => {
    const handlePopState = () => setView(getViewFromURL());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const activeView = useMemo(
    () => (view === "calendar" ? "online" : view),
    [view]
  );

  const navigateToView = (nextView) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", nextView);
    const nextURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", nextURL);
    setView(nextView);
  };

  const renderView = () => {
    switch (activeView) {
      case "admin":
        return <AdminDashboard />;
      case "online":
        return <OnlineBooking currentUser={CURRENT_USER} />;
      case "walk-in":
      default:
        return <WalkInBooking currentUser={CURRENT_USER} />;
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur md:p-8">
        <header className="mb-6 space-y-4 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-teal-700">
                LIFF Demo / 單機 localStorage 模式
              </p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                在地理髮店預約系統 MVP
              </h1>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Demo 客人：{CURRENT_USER.displayName} ({CURRENT_USER.lineUserId})
            </div>
          </div>

          {activeView !== "admin" && (
            <nav className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigateToView(item.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-teal-600 text-white shadow"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        {renderView()}
      </section>
    </main>
  );
}

export default App;
