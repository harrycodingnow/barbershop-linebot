export const STORAGE_KEY = "salon_data";

export const TIME_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00"
];

const OCCUPIED_STATUSES = new Set(["booked", "completed"]);

const getDefaultData = () => ({
  bookings: [],
  users: {}
});

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeSalonData = (rawData) => {
  const defaultData = getDefaultData();
  if (!rawData || typeof rawData !== "object") return defaultData;

  return {
    bookings: Array.isArray(rawData.bookings) ? rawData.bookings : [],
    users: rawData.users && typeof rawData.users === "object" ? rawData.users : {}
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
  return defaultData;
};

const buildBookingId = () =>
  `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
  return data.users[lineUserId];
};

export const createBooking = ({
  type,
  date,
  timeSlot,
  lineUserId,
  displayName,
  isDepositPaid
}) => {
  const data = readSalonData();
  const profile = data.users[lineUserId] ?? {
    displayName: displayName || "未知客人",
    isBlacklisted: false,
    notes: ""
  };

  data.users[lineUserId] = {
    ...profile,
    displayName: displayName || profile.displayName
  };

  const booking = {
    id: buildBookingId(),
    type,
    date,
    timeSlot,
    lineUserId,
    displayName: displayName || profile.displayName,
    status: "booked",
    isDepositPaid: Boolean(isDepositPaid)
  };

  data.bookings.push(booking);
  saveSalonData(data);
  return booking;
};

export const updateBookingStatus = (bookingId, status) => {
  const data = readSalonData();
  data.bookings = data.bookings.map((booking) =>
    booking.id === bookingId ? { ...booking, status } : booking
  );
  saveSalonData(data);
  return data.bookings.find((booking) => booking.id === bookingId) ?? null;
};

export const strikeUserForBooking = (
  bookingId,
  note = "未到店，已列入黑名單"
) => {
  const data = readSalonData();
  const target = data.bookings.find((booking) => booking.id === bookingId);
  if (!target) return null;

  target.status = "noshow";

  const existingUser = data.users[target.lineUserId] ?? {
    displayName: target.displayName,
    isBlacklisted: false,
    notes: ""
  };

  const mergedNotes = existingUser.notes
    ? `${existingUser.notes}\n${note}`
    : note;

  data.users[target.lineUserId] = {
    ...existingUser,
    displayName: existingUser.displayName || target.displayName,
    isBlacklisted: true,
    notes: mergedNotes
  };

  saveSalonData(data);
  return target;
};

export const isUserBlacklisted = (lineUserId) =>
  Boolean(readSalonData().users?.[lineUserId]?.isBlacklisted);

export const getBookingsByDate = (date) =>
  readSalonData().bookings
    .filter((booking) => booking.date === date)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

export const getTakenSlotsByDate = (date) =>
  readSalonData().bookings
    .filter(
      (booking) =>
        booking.date === date && OCCUPIED_STATUSES.has(booking.status || "booked")
    )
    .map((booking) => booking.timeSlot);
