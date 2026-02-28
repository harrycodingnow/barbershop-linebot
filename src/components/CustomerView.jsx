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
        <div className="max-w-xl mx-auto space-y-12 animate-in fade-in duration-700 py-8 relative z-10">

            {/* Debug / Mock Input Panel (Keep simple but themed) */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-soft border border-stone">
                <h2 className="font-sans font-semibold text-lg text-forest mb-4 flex items-center">
                    <span className="text-sage mr-3">🔧</span>
                    模擬設定
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm text-sage font-medium block">User ID</label>
                        <input
                            type="text"
                            value={lineUserId}
                            onChange={(e) => setLineUserId(e.target.value)}
                            className="font-mono bg-alabaster px-4 py-2 w-full border border-stone rounded-full focus:ring-2 focus:ring-sage focus:border-sage transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-sage font-medium block">顯示名稱</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-alabaster px-4 py-2 w-full border border-stone rounded-full focus:ring-2 focus:ring-sage focus:border-sage transition-all"
                        />
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button
                        onClick={generateRandomUser}
                        variant="outline"
                        className="text-xs px-6 py-2"
                    >
                        🔄 隨機產生
                    </Button>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-soft-md border border-stone space-y-6">

                {!status?.active ? (
                    <div className="text-center py-12">
                        <h3 className="text-4xl md:text-5xl font-display text-forest mb-4">
                            Welcome
                        </h3>
                        <p className="text-sage text-lg mb-12 max-w-sm mx-auto leading-relaxed">
                            歡迎光臨。請點選下方按鈕抽取您的現場專屬號碼牌，享受悠閒的等候時光。
                        </p>
                        <Button
                            onClick={handleCreateTicket}
                            variant="primary"
                            className="w-full md:w-auto md:px-16 py-4 text-lg"
                        >
                            抽取專屬號碼牌
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center">
                            <h3 className="font-sans tracking-[0.2em] text-sm uppercase text-sage font-semibold mb-8">
                                您的候位進度
                            </h3>

                            <div className="inline-block px-12 md:px-20 py-12 bg-clay-softer rounded-t-full rounded-b-[40px] border border-stone mb-4 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-soft-md">
                                <div className="absolute inset-0 bg-white/40 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <p className="text-sage text-xs font-semibold mb-2 tracking-[0.2em] uppercase">No.</p>
                                    <p className="text-8xl md:text-9xl font-display text-forest my-2 tracking-tighter">
                                        {status.ticket.ticketNumber}
                                    </p>
                                    <div className="mt-8">
                                        <span className={`px-6 py-2 rounded-full text-sm font-semibold tracking-wider transition-colors duration-500 ${status.ticket.status === 'called'
                                            ? 'bg-terracotta text-white shadow-soft animate-pulse'
                                            : 'bg-white text-forest border border-stone shadow-sm'
                                            }`}>
                                            {status.ticket.status === 'called' ? '已到號，請入座' : '現場等待中'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-stone pt-8">
                            <div className="flex flex-col items-center justify-center p-4">
                                <span className="text-sage text-xs uppercase tracking-widest mb-2 font-semibold">目前叫號</span>
                                <span className="font-display text-4xl text-forest">#{status.currentCalledNumber}</span>
                            </div>

                            {status.ticket.status === 'waiting' ? (
                                <div className="flex flex-col items-center justify-center p-4 bg-alabaster rounded-3xl border border-stone">
                                    <span className="text-terracotta text-xs uppercase tracking-widest mb-2 font-semibold">前方等待</span>
                                    <span className="font-display text-4xl text-terracotta">{status.peopleAhead} <span className="text-sm font-sans italic text-sage ml-1">人</span></span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4">
                                    <span className="text-sage text-xs uppercase tracking-widest mb-2 font-semibold">-</span>
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center p-4">
                                <span className="text-sage text-xs uppercase tracking-widest mb-2 font-semibold">抽號時間</span>
                                <span className="font-sans text-xl text-forest font-medium">
                                    {new Date(status.ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-6">
                            <Button
                                onClick={refreshStatus}
                                variant="outline"
                                className="flex-1"
                            >
                                更新進度
                            </Button>
                            <Button
                                onClick={handleCancelTicket}
                                variant="ghost"
                                className="flex-1 hover:text-terracotta hover:bg-transparent px-0"
                            >
                                取消候位
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
