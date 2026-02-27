# Salon LIFF MVP (localStorage Demo)

單頁 React 應用，透過 `?view=` 切換畫面，所有資料儲存在 `localStorage` 的 `salon_data`。

## 安裝與啟動

```bash
npm install
npm run dev
```

## View 切換

- `?view=walk-in`：現場預約（預設）
- `?view=online`：線上預約
- `?view=calendar`：線上預約（別名）
- `?view=admin`：老闆後台

## localStorage Schema

```json
{
  "bookings": [
    {
      "id": "bk_...",
      "type": "walk-in | online",
      "date": "YYYY-MM-DD",
      "timeSlot": "HH:mm",
      "lineUserId": "user_123",
      "displayName": "小明",
      "status": "booked | completed | noshow",
      "isDepositPaid": false
    }
  ],
  "users": {
    "user_123": {
      "displayName": "小明",
      "isBlacklisted": false,
      "notes": ""
    }
  }
}
```
# barbershop-linebot
