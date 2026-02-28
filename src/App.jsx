import { useEffect, useMemo, useState } from "react";
import WalkInBooking from "./components/WalkInBooking";
import OnlineBooking from "./components/OnlineBooking";
import AdminDashboard from "./components/AdminDashboard";
import { initSalonData } from "./utils/storage";
import Button from "./components/ui/Button";

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
    <main className="min-h-screen px-6 py-10 md:px-8 lg:px-12">
      <section className="mx-auto w-full max-w-6xl">
        <header className="space-y-8 border-b-4 border-black pb-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-600">
                LIFF Demo / Local Storage Mode
              </p>
              <h1 className="font-display text-5xl tracking-tight md:text-7xl lg:text-8xl">
                <span className="block">快理我</span>
                <span className="block">線上預約系統</span>
              </h1>
              <p className="max-w-2xl text-base text-neutral-700 md:text-lg">
                專為理髮店展示流程的預約系統。所有狀態與紀錄都儲存在瀏覽器本機。
              </p>
            </div>
          </div>

          {activeView !== "admin" && (
            <nav className="flex flex-wrap gap-3" aria-label="Booking Views">
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <Button
                    key={item.key}
                    onClick={() => navigateToView(item.key)}
                    variant={isActive ? "primary" : "outline"}
                    className="min-w-[160px]"
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          )}
        </header>

        <section className="pt-8">{renderView()}</section>
      </section>
    </main>
  );
}

export default App;
