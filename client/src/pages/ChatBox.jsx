import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal, Phone, Video } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { addMessage, fetchMessages, resetMessages } from "../features/messages/messagesSlice";
import VideoCall from "../components/VideoCall";

const ChatBox = () => {
    const { messages } = useSelector((state) => state.messages);
    const { userId } = useParams();
    const { getToken, userId: myUserId } = useAuth();
    const dispatch = useDispatch();

    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);
    const connections = useSelector((state) => state.connections.connections);

    const [activeCall, setActiveCall] = useState(null); // { callType, isCaller }
    const [incomingCall, setIncomingCall] = useState(null); // { callType }
    const callPollRef = useRef(null);

    const roomId = myUserId && userId
        ? [myUserId, userId].sort().join("_")
        : null;

    const fetchUserMessages = async () => {
        try {
            const token = await getToken();
            dispatch(fetchMessages({ token, userId }));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const sendMessage = async () => {
        try {
            if (!text && !image) return;
            const token = await getToken();
            const formData = new FormData();
            formData.append('to_user_id', userId);
            formData.append('text', text);
            if (image) formData.append('image', image);
            const { data } = await api.post('/api/message/send', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setText('');
                setImage(null);
                dispatch(addMessage(data.message));
            } else throw new Error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const startCall = (callType) => {
        setIncomingCall(null);
        setActiveCall({ callType, isCaller: true });
    };

    const acceptCall = () => {
        const callType = incomingCall.callType;
        setIncomingCall(null);
        setActiveCall({ callType, isCaller: false });
    };

    const declineCall = async () => {
        setIncomingCall(null);
        try { await api.delete(`/api/call/${roomId}`); } catch (_) {}
    };

    // Poll for incoming calls when not already in a call
    useEffect(() => {
        if (!roomId || activeCall) return;

        callPollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/api/call/${roomId}`);
                if (res.data?.offer && !activeCall) {
                    setIncomingCall({ callType: res.data.callType || "video" });
                }
            } catch (_) {}
        }, 2000);

        return () => clearInterval(callPollRef.current);
    }, [roomId, activeCall]);

    useEffect(() => {
        fetchUserMessages();
        return () => { dispatch(resetMessages()); };
    }, [userId]);

    useEffect(() => {
        if (connections.length > 0) {
            const u = connections.find((u) => u._id === userId);
            setUser(u);
        }
    }, [connections, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return user && (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42
            bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
                <img src={user.profile_picture} alt="" className="size-8 rounded-full" />
                <div className="flex-1">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
                </div>
                <div className="flex items-center gap-3 pr-2">
                    <button onClick={() => startCall("audio")} title="Audio Call"
                        className="p-2 rounded-full hover:bg-indigo-100 text-indigo-600 transition">
                        <Phone size={20} />
                    </button>
                    <button onClick={() => startCall("video")} title="Video Call"
                        className="p-2 rounded-full hover:bg-purple-100 text-purple-600 transition">
                        <Video size={20} />
                    </button>
                </div>
            </div>

            {/* Incoming call banner */}
            {incomingCall && !activeCall && (
                <div className="flex items-center justify-between bg-indigo-600 text-white px-4 py-2 text-sm">
                    <span>
                        📞 Incoming {incomingCall.callType === "video" ? "video" : "audio"} call from {user.full_name}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={acceptCall}
                            className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                            Accept
                        </button>
                        <button onClick={declineCall}
                            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* Active call overlay */}
            {activeCall && roomId && (
                <VideoCall
                    roomId={roomId}
                    callType={activeCall.callType}
                    isCaller={activeCall.isCaller}
                    onClose={() => setActiveCall(null)}
                />
            )}

            {/* Messages */}
            <div className="p-5 md:px-10 h-full overflow-y-scroll">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((message, index) => (
                        <div key={index} className={`flex flex-col ${message.to_user_id !== user._id ? 'items-start' : 'items-end'}`}>
                            <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg
                                shadow ${message.to_user_id !== user._id ? 'rounded-bl-none' : 'rounded-br-none'}`}>
                                {message.message_type === 'image' && (
                                    <img src={message.media_url} alt="" className="w-full max-w-sm rounded-lg mb-1" />
                                )}
                                <p>{message.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="px-4">
                <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl
                mx-auto border border-gray-200 shadow rounded-full mb-5">
                    <input type="text" className="flex-1 outline-none text-slate-700"
                        placeholder="Type a message..."
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        onChange={(e) => setText(e.target.value)}
                        value={text} />
                    <label htmlFor="image">
                        {image
                            ? <img src={URL.createObjectURL(image)} alt="" className="h-8 rounded" />
                            : <ImageIcon className="size-7 text-gray-400 cursor-pointer" />}
                        <input type="file" id="image" hidden onChange={(e) => setImage(e.target.files[0])} />
                    </label>
                    <button onClick={sendMessage}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700
                        hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full">
                        <SendHorizonal size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
