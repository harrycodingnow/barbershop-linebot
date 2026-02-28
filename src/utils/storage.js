export const STORAGE_KEY = "salon_queue_data";

const getDefaultData = () => ({
  tickets: [],
  users: {},
  // Tracks the daily sequence number. In a real app, this resets daily.
  lastTicketNumber: 0,
});

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeSalonData = (rawData) => {
  const defaultData = getDefaultData();
  if (!rawData || typeof rawData !== "object") return defaultData;

  return {
    tickets: Array.isArray(rawData.tickets) ? rawData.tickets : [],
    users: rawData.users && typeof rawData.users === "object" ? rawData.users : {},
    lastTicketNumber: typeof rawData.lastTicketNumber === "number" ? rawData.lastTicketNumber : 0,
  };
};

export const initSalonData = () => {
  if (!hasStorage()) return getDefaultData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialData = getDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }

    const parsed = JSON.parse(raw);
    const normalized = normalizeSalonData(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    const fallback = getDefaultData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

export const readSalonData = () => {
  if (!hasStorage()) return getDefaultData();
  const initializedData = initSalonData();
  return normalizeSalonData(initializedData);
};

export const saveSalonData = (data) => {
  if (!hasStorage()) return;
  const normalized = normalizeSalonData(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const resetSalonData = () => {
  const defaultData = getDefaultData();
  if (!hasStorage()) return defaultData;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  // Dispatch a custom event so other views can sink
  window.dispatchEvent(new Event('salon_data_updated'));
  return defaultData;
};

const buildTicketId = () =>
  `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Helper to notify other components (since they are on the same page but different views)
const notifyDataChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event('salon_data_updated'));
  }
};

export const upsertUser = (lineUserId, userPatch) => {
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
  saveSalonData(data);
  notifyDataChanged();
  return data.users[lineUserId];
};

/**
 * 核心的 TicketService，負責處理抽號碼牌的各項邏輯
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
    saveSalonData(data);
    notifyDataChanged();
    
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

    // 取得當前正在處理的號碼 (最後一個被called的，或是沒有called的話傳回0或null)
    const calledTickets = data.tickets.filter(t => t.status === "called").sort((a,b) => b.ticketNumber - a.ticketNumber);
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
    notifyDataChanged();
    return { success: true, ticket: data.tickets[activeIndex] };
  },

  // --- 以下為店家管理端 API ---

  // 4. 取得整體候位狀態 - 店家端
  getQueueStatus: () => {
    const data = readSalonData();
    
    const waitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a,b) => a.ticketNumber - b.ticketNumber);
    const calledTickets = data.tickets.filter(t => t.status === "called").sort((a,b) => b.ticketNumber - a.ticketNumber); // Descending by number
    const completedTickets = data.tickets.filter(t => t.status === "completed").sort((a,b) => b.ticketNumber - a.ticketNumber);

    const currentCalledNumber = calledTickets.length > 0 ? calledTickets[0].ticketNumber : (completedTickets.length > 0 ? completedTickets[0].ticketNumber : 0);
    const totalWaiting = waitingTickets.length;

    return {
      currentCalledNumber,
      totalWaiting,
      waitingTickets,
      calledTickets,
      activeTickets: data.tickets.filter(t => t.status === "waiting" || t.status === "called").sort((a,b) => a.ticketNumber - b.ticketNumber)
    };
  },

  // 5. 呼叫下一號 (Call Next) - 店家端
  callNext: () => {
    const data = readSalonData();
    // 找出目前號碼最小、且狀態為 waiting 的號碼
    const waitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a,b) => a.ticketNumber - b.ticketNumber);
    
    if (waitingTickets.length === 0) {
       return { success: false, error: "沒有人正在等候。" };
    }

    const nextTicket = waitingTickets[0];
    nextTicket.status = "called";
    nextTicket.calledAt = new Date().toISOString();

    // 更新資料庫
    const ticketIndex = data.tickets.findIndex(t => t.id === nextTicket.id);
    data.tickets[ticketIndex] = nextTicket;
    
    saveSalonData(data);
    notifyDataChanged();

    // 準備推播訊息 (Mock)
    const notifications = [];
    
    // 推播 1: 到號通知
    notifications.push({
      lineUserId: nextTicket.lineUserId,
      message: `🔔 輪到您了！您的號碼是 #${nextTicket.ticketNumber}，請向店內報到。`
    });

    // 推播 2: 快到號預先提醒 (前面只剩2位，所以是呼叫後，排在第2位的waiting客人)
    // 重新取得 waiting list
    const updatedWaitingTickets = data.tickets.filter(t => t.status === "waiting").sort((a,b) => a.ticketNumber - b.ticketNumber);
    if (updatedWaitingTickets.length >= 2) {
      // index 1 就是前方剩下兩位(index 0 是一位, 包含剛被叫的就不在waiting了)
      // 若是"剛好在前方剩下2人時提醒"，那代表他的位置是 updatedWaitingTickets[1]
      const reminderTicket = updatedWaitingTickets[1]; 
      notifications.push({
         lineUserId: reminderTicket.lineUserId,
         message: `🔔 快到號提醒：您的號碼 #${reminderTicket.ticketNumber} 前面只剩 2 位，請準備前往店內。`
      });
    }

    // TODO: 發送 Event 讓前端 Mock 推播
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
    
    data.tickets[activeIndex].status = newStatus;
    saveSalonData(data);
    notifyDataChanged();

    return { success: true, ticket: data.tickets[activeIndex] };
  },

  // 7. 每日重置 - 店家端
  resetDailyQueue: () => {
    return resetSalonData(); // 我們直接把整個 storage 覆蓋掉
  }
};
