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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b-2 border-neutral-200">
                <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center border">
                    <h2 className="text-xl font-bold text-gray-500 mb-2">目前叫號</h2>
                    <div className="text-7xl font-black text-blue-600 mb-4 tracking-tighter">
                        {queueStatus.currentCalledNumber > 0 ? `#${queueStatus.currentCalledNumber}` : '--'}
                    </div>
                    <Button
                        onClick={handleCallNext}
                        size="lg"
                        className="w-full text-lg py-4 hover:scale-[1.02] transition-transform"
                        disabled={queueStatus.totalWaiting === 0}
                    >
                        📢 呼叫下一號
                    </Button>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center border">
                    <h2 className="text-xl font-bold text-gray-500 mb-2">現場等候人數</h2>
                    <div className="text-7xl font-black text-neutral-800 tracking-tighter">
                        {queueStatus.totalWaiting} <span className="text-3xl font-medium text-gray-400 -ml-2">人</span>
                    </div>
                </div>
            </div>

            {/* 底部：控制面板與列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 左側：等待中列表 */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-2xl font-bold flex items-center">
                        <span className="bg-yellow-100 text-yellow-800 text-sm py-1 px-3 rounded-full mr-3">
                            等待中 ({queueStatus.waitingTickets.length})
                        </span>
                    </h3>

                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        {queueStatus.waitingTickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">目前無人等候</div>
                        ) : (
                            <ul className="divide-y">
                                {queueStatus.waitingTickets.map((ticket, index) => (
                                    <li key={ticket.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-black w-16 text-center text-neutral-400">
                                                #{ticket.ticketNumber}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">{ticket.displayName}</div>
                                                <div className="text-sm text-gray-500">
                                                    取號時間: {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {index === 0 && <span className="ml-2 text-blue-600 font-bold">👉 下一位</span>}
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
                    <h3 className="text-2xl font-bold flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full mr-3">
                            已叫號需處理
                        </span>
                    </h3>

                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        {queueStatus.calledTickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">無待處理號碼</div>
                        ) : (
                            <ul className="divide-y">
                                {queueStatus.calledTickets.map(ticket => (
                                    <li key={ticket.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-xl text-blue-600">#{ticket.ticketNumber}</div>
                                            <div className="font-medium">{ticket.displayName}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="text-red-500 border-red-200 hover:bg-red-50 text-sm"
                                                onClick={() => handleUpdateStatus(ticket.id, 'skipped')}
                                            >
                                                ⏭️ 過號
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white text-sm"
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
                            variant="outline"
                            className="w-full text-red-500 border-red-200 hover:bg-red-50"
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
