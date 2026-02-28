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
        <div className="flex justify-center mt-4">
            {/* Mock Mobile Phone Container */}
            <div className="w-[375px] h-[750px] bg-gray-100 rounded-[3rem] p-4 shadow-2xl relative border-[12px] border-neutral-900 overflow-hidden flex flex-col">

                {/* Notch mock */}
                <div className="absolute top-0 inset-x-0 h-6 bg-neutral-900 rounded-b-3xl w-1/2 mx-auto z-10"></div>

                {/* LINE Chat Header */}
                <div className="bg-[#00B900] -mx-4 -mt-4 pt-10 pb-3 px-4 flex items-center shadow-sm z-0 relative">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 text-white">
                        {'<'}
                    </div>
                    <span className="text-white font-bold flex-1 text-center pr-8 shadow-sm">
                        快理我 barbershop
                    </span>
                </div>

                {/* Chat Body */}
                <div className="flex-1 bg-[#859BA4] overflow-y-auto px-3 py-4 flex flex-col gap-4">

                    {/* Debug / Mock Input Panel */}
                    <div className="bg-white/90 p-3 rounded-lg text-xs shadow-sm mb-2">
                        <p className="font-bold text-gray-700 mb-2 border-b pb-1">🔧 模擬器設定</p>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="w-10">ID:</label>
                            <input
                                type="text"
                                value={lineUserId}
                                onChange={(e) => setLineUserId(e.target.value)}
                                className="font-mono bg-gray-100 px-2 py-1 flex-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="w-10">Name:</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="bg-gray-100 px-2 py-1 flex-1 border border-gray-300 rounded"
                            />
                        </div>
                        <button
                            onClick={generateRandomUser}
                            className="w-full bg-blue-100 text-blue-700 py-1 rounded hover:bg-blue-200"
                        >
                            🔄 切換隨機身份
                        </button>
                    </div>

                    {/* User actions (LIFF/Rich Menu buttons mock) */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        {!status?.active ? (
                            <button
                                onClick={handleCreateTicket}
                                className="col-span-2 bg-[#00B900] text-white py-3 rounded-xl font-bold shadow hover:bg-green-600 transition"
                            >
                                👉 點我抽號碼牌
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={refreshStatus}
                                    className="bg-blue-500 text-white py-2 rounded-xl font-bold shadow hover:bg-blue-600 transition"
                                >
                                    🔄 重新整理進度
                                </button>
                                <button
                                    onClick={handleCancelTicket}
                                    className="bg-gray-400 text-white py-2 rounded-xl font-bold shadow hover:bg-gray-500 transition"
                                >
                                    ❌ 取消候位
                                </button>
                            </>
                        )}
                    </div>

                    {/* Flex Message Display (If Active) */}
                    {status?.active && (
                        <div className="bg-white rounded-xl shadow p-5 border-t-8 border-[#00B900] animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="font-bold text-lg mb-4 text-center">現場候位進度</h3>

                            <div className="text-center mb-6">
                                <p className="text-gray-500 text-sm">您的號碼</p>
                                <p className="text-5xl font-black text-black my-1">
                                    #{status.ticket.ticketNumber}
                                </p>
                                <p className="text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.ticket.status === 'called' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {status.ticket.status === 'called' ? '📢 已到號，請前往' : '⌛ 等待中'}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-3 border-t pt-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">目前叫號</span>
                                    <span className="font-bold text-lg">#{status.currentCalledNumber}</span>
                                </div>
                                {status.ticket.status === 'waiting' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">前方等待人數</span>
                                        <span className="font-bold text-red-500 text-lg">{status.peopleAhead} 人</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">取號時間</span>
                                    <span className="text-gray-700">
                                        {new Date(status.ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
