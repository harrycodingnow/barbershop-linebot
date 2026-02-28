import { useEffect, useState } from "react";
import CustomerView from "./components/CustomerView";
import AdminView from "./components/AdminView";
import { initSalonData } from "./utils/storage";
import Button from "./components/ui/Button";

const VALID_VIEWS = new Set(["customer", "admin"]);

const getViewFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get("view");
  return VALID_VIEWS.has(rawView) ? rawView : "customer";
};

const NAV_ITEMS = [
  { key: "customer", label: "模擬 LINE Bot (客人端)" },
  { key: "admin", label: "店家管理後台 (Admin)" }
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

  const navigateToView = (nextView) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", nextView);
    const nextURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", nextURL);
    setView(nextView);
  };

  const renderView = () => {
    switch (view) {
      case "admin":
        return <AdminView />;
      case "customer":
      default:
        return <CustomerView />;
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-12 bg-neutral-50">
      <section className="mx-auto w-full max-w-6xl">
        <header className="space-y-6 border-b-4 border-black pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                Live Queueing MVP
              </p>
              <h1 className="font-display text-4xl tracking-tight md:text-5xl lg:text-6xl text-black">
                <span className="block">快理我</span>
                <span className="block">現場候位系統</span>
              </h1>
            </div>

            <nav className="flex flex-wrap gap-2" aria-label="Views">
              {NAV_ITEMS.map((item) => {
                const isActive = view === item.key;
                return (
                  <Button
                    key={item.key}
                    onClick={() => navigateToView(item.key)}
                    variant={isActive ? "primary" : "outline"}
                    className="min-w-[140px] text-sm py-2 px-4 shadow-sm"
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Global Toast Container for Mock Push Notifications */}
        <MockPushNotificationToast />

        <section className="pt-8">{renderView()}</section>
      </section>
    </main>
  );
}

// A simple component to listen for and display mock push notifications
function MockPushNotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleMockPush = (event) => {
      const newNotifs = event.detail;
      setNotifications((prev) => [...prev, ...newNotifs]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.slice(newNotifs.length));
      }, 5000);
    };

    window.addEventListener('mock_push_notification', handleMockPush);
    return () => window.removeEventListener('mock_push_notification', handleMockPush);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notif, idx) => (
        <div
          key={idx}
          className="bg-white border-l-4 border-green-500 shadow-xl rounded-r-lg p-4 animate-in slide-in-from-right fade-in duration-300 flex items-start space-x-3 pointer-events-auto"
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-1">對 User: {notif.lineUserId} 推播</p>
            <p className="text-sm text-gray-700">{notif.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
