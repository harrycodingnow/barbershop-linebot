import { useState, useEffect } from "react";
import Button from "./ui/Button";
import { TicketService } from "../utils/storage";

export default function AdminView() {
    const [queueStatus, setQueueStatus] = useState(TicketService.getQueueStatus());

    // Refresh status from storage whenever it changes or on mount
    const refreshStatus = () => setQueueStatus(TicketService.getQueueStatus());

    useEffect(() => {
        window.addEventListener('salon_data_updated', refreshStatus);
        return () => window.removeEventListener('salon_data_updated', refreshStatus);
    }, []);

    const handleCallNext = () => {
        const result = TicketService.callNext();
        if (!result.success) {
            alert(result.error);
        }
    };

    const handleUpdateStatus = (ticketId, newStatus) => {
        TicketService.updateTicketStatus(ticketId, newStatus);
    };

    const handleReset = () => {
        if (window.confirm("警告：這將清空所有當日候位紀錄並重置號碼，確定嗎？")) {
            TicketService.resetDailyQueue();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 頂部：狀態大看板 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b-2 border-stone">
                <div className="bg-clay-softer rounded-[32px] p-8 shadow-soft flex flex-col justify-center items-center text-center border border-stone">
                    <h2 className="text-xl font-sans font-semibold text-sage mb-2 tracking-widest uppercase">目前叫號</h2>
                    <div className="text-7xl font-display text-forest mb-4 tracking-tighter">
                        {queueStatus.currentCalledNumber > 0 ? `#${queueStatus.currentCalledNumber}` : '--'}
                    </div>
                    <Button
                        onClick={handleCallNext}
                        variant="primary"
                        className="w-full text-lg py-4 md:px-12 rounded-full"
                        disabled={queueStatus.totalWaiting === 0}
                    >
                        📢 呼叫下一號
                    </Button>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col justify-center items-center text-center border border-stone">
                    <h2 className="text-xl font-sans font-semibold text-sage mb-2 tracking-widest uppercase">現場等候人數</h2>
                    <div className="text-7xl font-display text-forest tracking-tighter">
                        {queueStatus.totalWaiting} <span className="text-3xl font-sans italic text-sage -ml-2">人</span>
                    </div>
                </div>
            </div>

            {/* 底部：控制面板與列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 左側：等待中列表 */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-2xl font-display text-forest flex items-center">
                        <span className="bg-clay-softer text-forest border border-stone text-sm py-1 px-4 rounded-full mr-3 font-sans">
                            等待中 ({queueStatus.waitingTickets.length})
                        </span>
                    </h3>

                    <div className="bg-white rounded-[24px] shadow-sm border border-stone overflow-hidden">
                        {queueStatus.waitingTickets.length === 0 ? (
                            <div className="p-8 text-center text-sage font-sans italic">目前無人等候</div>
                        ) : (
                            <ul className="divide-y divide-stone">
                                {queueStatus.waitingTickets.map((ticket, index) => (
                                    <li key={ticket.id} className="p-4 flex items-center justify-between hover:bg-alabaster transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl font-display w-16 text-center text-sage">
                                                #{ticket.ticketNumber}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-forest text-lg">{ticket.displayName}</div>
                                                <div className="text-sm text-sage font-sans">
                                                    取號時間: {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {index === 0 && <span className="ml-2 text-terracotta font-semibold italic">👉 下一位</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* 右側：處理中/已叫號列表 */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-display text-forest flex items-center">
                        <span className="bg-terracotta/10 text-terracotta text-sm py-1 px-4 rounded-full mr-3 font-sans border border-terracotta/20">
                            已叫號需處理
                        </span>
                    </h3>

                    <div className="bg-white rounded-[24px] shadow-sm border border-stone overflow-hidden">
                        {queueStatus.calledTickets.length === 0 ? (
                            <div className="p-8 text-center text-sage font-sans italic text-sm">無待處理號碼</div>
                        ) : (
                            <ul className="divide-y divide-stone">
                                {queueStatus.calledTickets.map(ticket => (
                                    <li key={ticket.id} className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="font-display font-medium text-2xl text-terracotta">#{ticket.ticketNumber}</div>
                                            <div className="font-semibold text-forest">{ticket.displayName}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                className="text-terracotta border-terracotta/30 hover:bg-terracotta/5 hover:border-terracotta text-xs"
                                                onClick={() => handleUpdateStatus(ticket.id, 'skipped')}
                                            >
                                                ⏭️ 過號
                                            </Button>
                                            <Button
                                                variant="primary"
                                                className="bg-forest hover:bg-forest-light text-white text-xs"
                                                onClick={() => handleUpdateStatus(ticket.id, 'completed')}
                                            >
                                                ✅ 完成
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pt-8">
                        <Button
                            variant="ghost"
                            className="w-full text-terracotta hover:text-terracotta/80 py-3 text-sm font-sans"
                            onClick={handleReset}
                        >
                            ⚠️ 每日重置 (清空資料)
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
