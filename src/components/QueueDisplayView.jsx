import { useState, useEffect } from "react";
import Button from "./ui/Button";
import { TicketService } from "../utils/storage";

export default function QueueDisplayView({ navigateToView }) {
    const [queueStatus, setQueueStatus] = useState(TicketService.getQueueStatus());

    // Refresh status from storage whenever it changes or on mount
    const refreshStatus = () => setQueueStatus(TicketService.getQueueStatus());

    useEffect(() => {
        window.addEventListener('salon_data_updated', refreshStatus);
        return () => window.removeEventListener('salon_data_updated', refreshStatus);
    }, []);

    // Get the next up to 5 waiting tickets
    const upcomingTickets = queueStatus.waitingTickets.slice(0, 5);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 py-8">

            {/* Top Section: The Big Display */}
            <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-soft-md border border-stone text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-4 bg-terracotta/20"></div>
                <h2 className="font-sans font-semibold text-2xl text-sage mb-6 tracking-[0.2em] uppercase">
                    目前叫號
                </h2>

                <div className="text-9xl md:text-[10rem] font-display text-forest tracking-tighter mb-4 leading-none">
                    {queueStatus.currentCalledNumber > 0 ? `#${queueStatus.currentCalledNumber}` : '--'}
                </div>

                <div className="mt-8 pt-8 border-t border-stone inline-block w-2/3 md:w-1/2">
                    <p className="text-sage font-sans uppercase tracking-widest text-sm mb-2">現場等候</p>
                    <p className="text-4xl font-display text-terracotta">
                        {queueStatus.totalWaiting} <span className="text-2xl font-sans italic text-sage ml-1">人</span>
                    </p>
                </div>
            </div>

            {/* Bottom Section: Upcoming Queue */}
            <div className="space-y-6">
                <h3 className="text-2xl font-display text-forest flex items-center justify-center mb-8">
                    <span className="bg-clay-softer text-forest border border-stone text-sm py-1 px-4 rounded-full font-sans tracking-widest uppercase shadow-sm">
                        接下來的等候名單
                    </span>
                </h3>

                {upcomingTickets.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 text-center border border-stone">
                        <p className="text-sage font-sans italic text-lg">目前無需等候，歡迎直接入座</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                        {upcomingTickets.map((ticket, index) => (
                            <div
                                key={ticket.id}
                                className={`bg-white rounded-full px-8 py-4 shadow-sm border border-stone flex items-center justify-between transition-all duration-500
                                    ${index === 0 ? 'ring-2 ring-terracotta/30 bg-terracotta/5 scale-[1.02]' : 'hover:bg-alabaster'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 text-3xl font-display text-sage font-semibold">
                                        #{ticket.ticketNumber}
                                    </div>
                                    <div className="font-semibold text-forest text-lg">
                                        {ticket.displayName}
                                    </div>
                                </div>
                                <div className="text-xs text-sage/70 font-sans text-right">
                                    {index === 0 && (
                                        <span className="text-[10px] text-terracotta uppercase tracking-widest font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-terracotta/20 mr-4">
                                            下一位
                                        </span>
                                    )}
                                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
