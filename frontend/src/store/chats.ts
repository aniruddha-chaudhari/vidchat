import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "./user";

axios.defaults.withCredentials = true;

interface Message {
    id?: number;
    chatId: number;
    senderId: number;
    content: string;
    createdAt?: Date;
}

interface Chat {
    id: number;
    participants: number[];
    messages: Message[];
}

interface ChatStore {
    chats: Chat[];
    currentChat: Chat | null;
    loading: boolean;
    startIndividualChat: (receiverId: string) => Promise<void>;
    sendMessage: (content: string, chatId: number) => void;
    setCurrentChat: (chat: Chat | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    chats: [],
    currentChat: null,
    loading: false,

    startIndividualChat: async (receiverId: string) => {
        set({ loading: true });
        try {
            const response = await axios.post(
                "http://localhost:5000/api/chats/individualchat",
                { receiverId },
                { withCredentials: true }
            );
            
            const newChat = response.data;
            set((state) => ({
                chats: [...state.chats, newChat],
                currentChat: newChat,
                loading: false
            }));

            // Join the chat room via socket from UserStore
            const socket = useUserStore.getState().socket;
            if (socket) {
                socket.emit('join_chat', newChat.chatId);
            }
            console.log("Chat started:", newChat);
        } catch (error) {
            set({ loading: false });
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || "Failed to start chat");
        }
    },

    sendMessage: async (content: string, chatId: number) => {
        const socket = useUserStore.getState().socket;
        if (!socket) {
            toast.error("No socket connection");
            return;
        }

        try {
            // First save message to database
            const response = await axios.post(
                `http://localhost:5000/api/messages/${chatId}`,
                { content },
                { withCredentials: true }
            );

            const savedMessage = response.data;

            // Then emit socket event with saved message
            socket.emit('send_message', savedMessage);
            
            // Update local state with saved message
            set((state) => ({
                chats: state.chats.map(chat => {
                    if (chat.id === chatId) {
                        return {
                            ...chat,
                            messages: [...chat.messages, savedMessage]
                        };
                    }
                    return chat;
                }),
                currentChat: state.currentChat?.id === chatId ? {
                    ...state.currentChat,
                    messages: [...state.currentChat.messages, savedMessage]
                } : state.currentChat
            }));

        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || "Failed to send message");
        }
    },

    setCurrentChat: (chat: Chat | null) => {
        set({ currentChat: chat });
        const socket = useUserStore.getState().socket;
        if (socket && chat) {
            socket.emit('join_chat', chat.id);
        }
    }
}));