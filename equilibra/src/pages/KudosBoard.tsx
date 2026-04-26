import { useState, useEffect } from "react";
import { Heart, Plus, ShieldAlert, Sparkles, Trophy, User as UserIcon } from "lucide-react";
import { KudosService } from "../services/KudosService";
import type { Kudo } from "../services/KudosService";
import { userService } from "../services/userService";
import { useAuth } from "../auth/useAuth";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import type { User } from "../models";

// Helper to format relative time instead of date-fns
function formatDistanceToNow(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

// Modals component
const GiveKudoModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    users, 
    currentUser 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSuccess: () => void;
    users: User[];
    currentUser: any;
}) => {
    const [receiverId, setReceiverId] = useState("");
    const [message, setMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverId || !message.trim()) return;

        setIsSubmitting(true);
        try {
            await KudosService.createKudo(receiverId, message, isAnonymous);
            onSuccess();
            onClose();
            setReceiverId("");
            setMessage("");
            setIsAnonymous(false);
        } catch (error) {
            console.error("Failed to submit kudo:", error);
            // Optionally, show a toast here
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentUserId = currentUser?.db_user?.id || currentUser?.id;
    const otherUsers = users.filter(u => String(u.id) !== String(currentUserId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0B0E14] border border-[#374151] w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-yellow-400" size={20} />
                        Give Kudos
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">To</label>
                        <select
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                            className="w-full bg-[#151A22] border border-[#374151] rounded-xl p-3 text-white focus:border-[#3B82F6] outline-none transition-all"
                            required
                        >
                            <option value="" disabled>Select team member...</option>
                            {otherUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.display_name || user.gh_username || user.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-[#151A22] border border-[#374151] rounded-xl p-3 text-white focus:border-[#3B82F6] outline-none transition-all min-h-[120px]"
                            placeholder="Express your appreciation..."
                            required
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#151A22] border border-[#374151] rounded-xl cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isAnonymous ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-[#374151]'}`}>
                            {isAnonymous && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">Send Anonymously</p>
                            <p className="text-xs text-slate-500">Your identity will be hidden on the board.</p>
                        </div>
                        {isAnonymous && <ShieldAlert size={16} className="text-slate-400" />}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-[#1F2937] transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !receiverId || !message.trim()}
                            className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Kudos'}
                            {!isSubmitting && <Heart size={16} fill="currentColor" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export function KudosBoard() {
    const { user: currentUser } = useAuth();
    const [kudos, setKudos] = useState<Kudo[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [kudosData, usersData] = await Promise.all([
                KudosService.getKudos(50),
                userService.getUsers()
            ]);
            setKudos(kudosData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load kudos board data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) return <LoadingScreen message="Loading Appreciation Board..." />;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-gradient-to-br from-pink-500 to-rose-500 text-transparent bg-clip-text">
                            Appreciation Board
                        </span>
                        <Trophy className="text-yellow-400" size={28} />
                    </h1>
                    <p className="text-slate-400">Celebrate the small and big wins of your team.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-slate-200 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    Give Kudos
                </button>
            </div>

            {/* Kudos Feed */}
            {kudos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#151A22] border border-[#374151] rounded-2xl text-center">
                    <div className="w-20 h-20 bg-[#1F2937] rounded-full flex items-center justify-center mb-4">
                        <Heart className="text-slate-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Kudos yet</h3>
                    <p className="text-slate-400 max-w-sm mb-6">
                        Be the first to show some appreciation to your amazing team members!
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-pink-500 hover:text-pink-400 font-medium"
                    >
                        Send the first Kudos →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kudos.map((kudo) => (
                        <div 
                            key={kudo.id} 
                            className="bg-gradient-to-b from-[#151A22] to-[#0B0E14] border border-[#374151] hover:border-pink-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] flex flex-col h-full group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {kudo.receiver_name ? kudo.receiver_name.charAt(0).toUpperCase() : kudo.receiver_username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">To</p>
                                        <p className="font-bold text-white">{kudo.receiver_name || kudo.receiver_username || 'Unknown'}</p>
                                    </div>
                                </div>
                                <Heart className="text-pink-500/30 group-hover:text-pink-500 transition-colors" size={24} fill="currentColor" />
                            </div>
                            
                            <div className="flex-1 bg-white/5 rounded-xl p-4 mb-4 text-slate-300 italic">
                                "{kudo.message}"
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                                <div className="flex items-center gap-1.5 bg-[#1F2937] px-2.5 py-1.5 rounded-lg">
                                    <UserIcon size={12} />
                                    <span>From: <span className="font-medium text-slate-300">{kudo.sender_name || 'Unknown'}</span></span>
                                </div>
                                <span>{formatDistanceToNow(kudo.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <GiveKudoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                users={users}
                currentUser={currentUser!}
            />
        </div>
    );
}
