import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// Default state structure
const getDefaultData = () => ({
  tickets: [],
  users: {},
  lastTicketNumber: 0,
});

// Since Components expect synchronous reads, we keep a local cache.
let localCache = getDefaultData();

// Document reference in Firestore
const SALON_DOC_ID = "salon/demo";
const docRef = doc(db, SALON_DOC_ID);

// 1. Initialize Firebase listener to sync local cache automatically
export const initSalonData = () => {
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      localCache = { ...getDefaultData(), ...docSnap.data() };
    } else {
      // First time setup: push default data to Firebase
      setDoc(docRef, getDefaultData());
    }
    // Notify components that data has updated
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('salon_data_updated'));
    }
  });

  return localCache;
};

// 2. Synchronous read from the constantly updated local cache
// We MUST return a deep clone here because React components use reference equality
// (like `setQueueStatus(data)`) to determine whether to re-render.
export const readSalonData = () => {
  return JSON.parse(JSON.stringify(localCache));
};

// 3. Write updates back to Firestore
export const saveSalonData = async (data) => {
  localCache = data; // Optimistic update
  try {
    await setDoc(docRef, data);
  } catch (e) {
    console.error("Error saving to Firebase:", e);
  }
};

export const resetSalonData = async () => {
  const defaultData = getDefaultData();
  await saveSalonData(defaultData);
  return defaultData;
};

const buildTicketId = () =>
  `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const upsertUser = async (lineUserId, userPatch) => {
  const data = readSalonData();
  const existing = data.users[lineUserId] ?? {
    displayName: userPatch?.displayName ?? "未知客人",
    isBlacklisted: false,
    notes: ""
  };

  data.users[lineUserId] = {
    ...existing,
    ...userPatch
  };
  await saveSalonData(data);
  return data.users[lineUserId];
};

/**
 * 核心的 TicketService，負責處理抽號碼牌的各項邏輯
 * 介面 (API) 維持不變，但底層改為 async 寫入 Firestore。
 * UI 元件不一定要 `await` 因為內部有 Optimistic Update，畫面會由 onSnapshot 觸發重繪。
 */
export const TicketService = {
  // 1. 抽號碼牌 (Create Ticket)
  createTicket: (lineUserId, displayName) => {
    const data = readSalonData();

    // 檢查該客人是否已經有 waiting 或 called 的單子
    const activeTicket = data.tickets.find(
      (t) => t.lineUserId === lineUserId && (t.status === "waiting" || t.status === "called")
    );
    if (activeTicket) {
      return { success: false, error: "您已經在候位中，無法重複抽號。", ticket: activeTicket };
    }

    // 更新號碼牌序號
    data.lastTicketNumber += 1;
    const newNumber = data.lastTicketNumber;

    // 更新或建立使用者
    const profile = data.users[lineUserId] ?? { displayName: displayName || "未知客人", isBlacklisted: false, notes: "" };
    data.users[lineUserId] = { ...profile, displayName: displayName || profile.displayName };

    const newTicket = {
      id: buildTicketId(),
      ticketNumber: newNumber,
      lineUserId,
      displayName: data.users[lineUserId].displayName,
      status: "waiting", // 'waiting', 'called', 'skipped', 'completed', 'cancelled'
      createdAt: new Date().toISOString(),
      calledAt: null,
    };

    data.tickets.push(newTicket);
    saveSalonData(data); // Async write to FB, but localCache is instantly updated.

    return { success: true, ticket: newTicket };
  },

  // 2. 查詢進度 (Check Status) - 客人端
  checkStatus: (lineUserId) => {
    const data = readSalonData();
    const activeTicket = data.tickets.find(
      (t) => t.lineUserId === lineUserId && (t.status === "waiting" || t.status === "called")
    );

    if (!activeTicket) return { active: false };

    // 計算前方等待人數: status為waiting，且ticketNumber小於自己的
    const peopleAhead = data.tickets.filter(
      (t) => t.status === "waiting" && t.ticketNumber < activeTicket.ticketNumber
    ).length;

    // 取得當前正在處理的號碼
    const calledTickets = data.tickets.filter(t => t.status === "called").sort((a, b) => b.ticketNumber - a.ticketNumber);
    const currentCalledNumber = calledTickets.length > 0 ? calledTickets[0].ticketNumber : 0;

    return {
      active: true,
      ticket: activeTicket,
      peopleAhead,
      currentCalledNumber,
    };
  },

  // 3. 取消候位 (Cancel Ticket) - 客人端
  cancelTicket: (lineUserId) => {
    const data = readSalonData();
    const activeIndex = data.tickets.findIndex(
      (t) => t.lineUserId === lineUserId && (t.status === "waiting" || t.status === "called")
    );

    if (activeIndex === -1) return { success: false, error: "找不到有效的候位紀錄。" };

    data.tickets[activeIndex].status = "cancelled";
    saveSalonData(data);
    return { success: true, ticket: data.tickets[activeIndex] };
  },

  // --- 以下為店家管理端 API ---

  // 4. 取得整體候位狀態 - 店家端
  getQueueStatus: () => {
    const data = readSalonData();

    const waitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a, b) => a.ticketNumber - b.ticketNumber);
    const calledTickets = data.tickets.filter(t => t.status === "called").sort((a, b) => b.ticketNumber - a.ticketNumber);
    const completedTickets = data.tickets.filter(t => t.status === "completed").sort((a, b) => b.ticketNumber - a.ticketNumber);

    const currentCalledNumber = calledTickets.length > 0 ? calledTickets[0].ticketNumber : (completedTickets.length > 0 ? completedTickets[0].ticketNumber : 0);
    const totalWaiting = waitingTickets.length;

    return {
      currentCalledNumber,
      totalWaiting,
      waitingTickets,
      calledTickets,
      activeTickets: data.tickets.filter(t => t.status === "waiting" || t.status === "called").sort((a, b) => a.ticketNumber - b.ticketNumber)
    };
  },

  // 5. 呼叫下一號 (Call Next) - 店家端
  callNext: () => {
    const data = readSalonData();
    const waitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a, b) => a.ticketNumber - b.ticketNumber);

    if (waitingTickets.length === 0) {
      return { success: false, error: "沒有人正在等候。" };
    }

    const nextTicket = waitingTickets[0];
    nextTicket.status = "called";
    nextTicket.calledAt = new Date().toISOString();

    const ticketIndex = data.tickets.findIndex(t => t.id === nextTicket.id);
    data.tickets[ticketIndex] = nextTicket;

    saveSalonData(data);

    // Mock Push Notifications Logic
    const notifications = [];
    notifications.push({
      lineUserId: nextTicket.lineUserId,
      message: `🔔 輪到您了！您的號碼是 #${nextTicket.ticketNumber}，請向店內報到。`
    });

    const updatedWaitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a, b) => a.ticketNumber - b.ticketNumber);
    if (updatedWaitingTickets.length >= 2) {
      const reminderTicket = updatedWaitingTickets[1];
      notifications.push({
        lineUserId: reminderTicket.lineUserId,
        message: `🔔 快到號提醒：您的號碼 #${reminderTicket.ticketNumber} 前面只剩 2 位，請準備前往店內。`
      });
    }

    if (typeof window !== "undefined" && notifications.length > 0) {
      window.dispatchEvent(new CustomEvent('mock_push_notification', { detail: notifications }));
    }

    return { success: true, ticket: nextTicket, notifications };
  },

  // 6. 標記狀態 (Skip / Complete) - 店家端
  updateTicketStatus: (ticketId, newStatus) => {
    const data = readSalonData();
    const activeIndex = data.tickets.findIndex(t => t.id === ticketId);

    if (activeIndex === -1) return { success: false, error: "找不到該號碼牌。" };

    if (newStatus === "skipped") {
      const oldTicketNumber = data.tickets[activeIndex].ticketNumber;
      data.lastTicketNumber += 1;
      data.tickets[activeIndex].ticketNumber = data.lastTicketNumber;
      data.tickets[activeIndex].status = "waiting";
      data.tickets[activeIndex].createdAt = new Date().toISOString();

      const currentName = data.tickets[activeIndex].displayName;
      const baseName = currentName.replace(/\s*\(原 #\d+ 號過號\)/, '');
      data.tickets[activeIndex].displayName = `${baseName} (原 #${oldTicketNumber} 號過號)`;
    } else {
      data.tickets[activeIndex].status = newStatus;
    }

    saveSalonData(data);

    return { success: true, ticket: data.tickets[activeIndex] };
  },

  // 7. 每日重置 - 店家端
  resetDailyQueue: () => {
    return resetSalonData();
  }
};
