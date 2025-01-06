import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "./user";
// import { console } from "inspector";

axios.defaults.withCredentials = true;

interface Message {
    id?: number;
    chatId: number;
    senderId: number;
    content: string;
    createdAt?: Date;
    chat_id?: number;  // Add this to match server response
    created_at?: string;  // Add this to match server response
    is_read?: boolean;  // Add this to match server response
}

interface Chat {
    id: number;
    participants: number[];
    messages: Message[];
}

// Add this interface after the existing interfaces
interface ServerChatResponse {
    chatId: number;
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
    handleIncomingMessage: (message: Message) => void; // Add this method to handle received messages
    loadCachedMessages: (chatId: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    chats: [],
    currentChat: null,
    loading: false,

    startIndividualChat: async (receiverId: string) => {
        set({ loading: true });
        try {
            const response = await axios.post<ServerChatResponse>(
                "http://localhost:5000/api/chats/individualchat",
                { receiverId },
                { withCredentials: true }
            );
            
            // Ensure we have valid data with defaults
            const newChat: Chat = {
                id: response.data.chatId,
                participants: response.data.participants || [],
                messages: response.data.messages || []
            };

            console.log("Server response:", response.data);
            console.log("Formatted chat:", newChat);

            set((state) => {
                // Check if chat already exists
                const chatExists = state.chats.some(chat => chat.id === newChat.id);
                
                return {
                    chats: chatExists 
                        ? state.chats.map(chat => chat.id === newChat.id ? newChat : chat)
                        : [...state.chats, newChat],
                    currentChat: newChat,
                    loading: false
                };
            });

            // Join the chat room via socket
            const socket = useUserStore.getState().socket;
            if (socket) {
                socket.emit('join_chat', newChat.id);
                socket.emit('get_cached_messages', newChat.id);
                socket.once('cached_messages', (cachedMessages: Message[]) => {
                    set(state => ({
                        ...state,
                        currentChat: {
                            ...newChat,
                            messages: cachedMessages
                        }
                    }));
                });
            }
        } catch (error) {
            set({ loading: false });
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || "Failed to start chat");
        }
    },

    sendMessage: async (content: string, chatId: number) => {
        const socket = useUserStore.getState().socket;
        const currentUser = useUserStore.getState().user;
        
        if (!socket || !currentUser) {
            console.error('Socket connection or user not available');
            toast.error("Connection error");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/messages/send/${chatId}`,
                { 
                    content,
                    senderId: currentUser.id // Explicitly send the senderId
                },
                { withCredentials: true }
            );
            
            const savedMessage = {
                ...response.data,
                senderId: currentUser.id // Ensure senderId is set
            };
            
            socket.emit('send_message', savedMessage);

        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            console.error('Failed to send message:', axiosError);
            toast.error(axiosError.response?.data?.message || "Failed to send message");
        }
    },

    setCurrentChat: (chat: Chat | null) => {
        set({ currentChat: chat });
        const socket = useUserStore.getState().socket;
        if (socket && chat) {
            socket.emit('join_chat', chat.id);
        }
    },

    handleIncomingMessage: (message: Message) => {
        console.log('Handling incoming message:', message);
        const chatId = message.chat_id || message.chatId;
        const currentUser = useUserStore.getState().user;
        
        if (!chatId || !message.senderId) {
            console.error('Invalid message format:', message);
            return;
        }

        set((state: ChatStore) => {
            const formattedMessage: Message = {
                id: message.id,
                chatId: chatId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.created_at ? new Date(message.created_at) : 
                          message.createdAt || new Date(),
                is_read: message.is_read
            };

            const updatedChats = state.chats.map(chat => {
                if (chat.id === chatId) {
                    return {
                        ...chat,
                        messages: [...chat.messages, formattedMessage]
                    };
                }
                return chat;
            });

            const updatedCurrentChat = state.currentChat?.id === chatId ? {
                ...state.currentChat,
                messages: [...state.currentChat.messages, formattedMessage]
            } : state.currentChat;

            return {
                ...state,
                chats: updatedChats,
                currentChat: updatedCurrentChat
            };
        });
    },

    loadCachedMessages: (chatId: number) => {
        const socket = useUserStore.getState().socket;
        if (socket) {
            socket.emit('get_cached_messages', chatId);
            socket.once('cached_messages', (messages: Message[]) => {
                set(state => ({
                    chats: state.chats.map(chat => 
                        chat.id === chatId ? { ...chat, messages } : chat
                    ),
                    currentChat: state.currentChat?.id === chatId ? 
                        { ...state.currentChat, messages } : 
                        state.currentChat
                }));
            });
        }
    }
}));