import { useState, useEffect } from "react";
import Button from "./ui/Button";
import { TicketService } from "../utils/storage";

export default function CustomerView() {
    const [lineUserId, setLineUserId] = useState("user_123");
    const [displayName, setDisplayName] = useState("小明");
    const [status, setStatus] = useState(null);

    // Sync state when storage changes or on mount
    const refreshStatus = () => {
        setStatus(TicketService.checkStatus(lineUserId));
    };

    useEffect(() => {
        refreshStatus();
        const handleStorageUpdate = () => refreshStatus();
        window.addEventListener('salon_data_updated', handleStorageUpdate);
        return () => window.removeEventListener('salon_data_updated', handleStorageUpdate);
    }, [lineUserId]);

    const handleCreateTicket = () => {
        const result = TicketService.createTicket(lineUserId, displayName);
        if (!result.success) {
            alert(result.error);
        }
    };

    const handleCancelTicket = () => {
        if (window.confirm("確定要取消候位嗎？")) {
            const result = TicketService.cancelTicket(lineUserId);
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    // Generate a random User ID to simulate multiple users
    const generateRandomUser = () => {
        const randId = Math.random().toString(36).slice(2, 6);
        setLineUserId(`user_${randId}`);
        setDisplayName(`客人_${randId.toUpperCase()}`);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Debug / Mock Input Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="font-bold text-xl text-neutral-800 mb-4 flex items-center">
                    <span className="bg-neutral-100 p-2 rounded-lg mr-3">🔧</span>
                    目前使用者身分
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-600 block">User ID</label>
                        <input
                            type="text"
                            value={lineUserId}
                            onChange={(e) => setLineUserId(e.target.value)}
                            className="font-mono bg-neutral-50 px-3 py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-600 block">顯示名稱</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-neutral-50 px-3 py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={generateRandomUser}
                        variant="outline"
                        className="text-sm"
                    >
                        🔄 隨機產生
                    </Button>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">

                {!status?.active ? (
                    <div className="text-center py-8">
                        <h3 className="text-2xl font-bold mb-2">歡迎光臨</h3>
                        <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
                            點擊下方按鈕抽取您的現場專屬號碼牌
                        </p>
                        <Button
                            onClick={handleCreateTicket}
                            size="lg"
                            className="w-full md:w-auto md:px-12 py-4 text-lg bg-black text-white hover:bg-neutral-800 transition-all hover:scale-105"
                        >
                            👉 抽取號碼牌
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <h3 className="font-bold text-xl mb-6 text-neutral-600">您的候位進度</h3>

                            <div className="inline-block px-12 py-8 bg-neutral-50 rounded-3xl border border-neutral-200 mb-6 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-neutral-500 text-sm font-medium mb-1 tracking-widest uppercase">號碼牌</p>
                                    <p className="text-7xl font-black text-blue-600 my-2 tracking-tighter">
                                        #{status.ticket.ticketNumber}
                                    </p>
                                    <div className="mt-4">
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${status.ticket.status === 'called'
                                                ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 animate-pulse'
                                                : 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                            }`}>
                                            {status.ticket.status === 'called' ? '📢 已到號，請前往店內' : '⌛ 現場等待中'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-6">
                            <div className="bg-neutral-50 p-4 rounded-xl text-center">
                                <span className="block text-neutral-500 text-sm mb-1">目前叫號</span>
                                <span className="font-bold text-2xl text-neutral-800">#{status.currentCalledNumber}</span>
                            </div>

                            {status.ticket.status === 'waiting' && (
                                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                                    <span className="block text-red-600 text-sm mb-1 font-medium">前方等待</span>
                                    <span className="font-bold text-2xl text-red-600">{status.peopleAhead} <span className="text-sm font-normal">人</span></span>
                                </div>
                            )}

                            <div className="bg-neutral-50 p-4 rounded-xl text-center">
                                <span className="block text-neutral-500 text-sm mb-1">抽號時間</span>
                                <span className="font-bold text-lg text-neutral-700">
                                    {new Date(status.ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                onClick={refreshStatus}
                                variant="outline"
                                className="flex-1"
                            >
                                🔄 重新整理
                            </Button>
                            <Button
                                onClick={handleCancelTicket}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                                ❌ 取消候位
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
