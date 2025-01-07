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
    sender_id?: number; // Add this for backend compatibility
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
    startIndividualChat: (receiverId: string) => Promise<Chat | null>;  // Updated return type
    sendMessage: (content: string, chatId: number) => void;
    setCurrentChat: (chat: Chat | null) => void;
    handleIncomingMessage: (message: Message) => void; // Add this method to handle received messages
    loadCachedMessages: (chatId: number) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
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
            
            const newChat: Chat = {
                id: response.data.chatId,
                participants: response.data.participants || [],
                messages: response.data.messages || []
            };

            set((state) => {
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
            }
            
            return newChat; // Return the chat object
        } catch (error) {
            set({ loading: false });
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || "Failed to start chat");
            return null;
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
        const chatId = message.chat_id || message.chatId;
        const senderId = message.sender_id || message.senderId;
        
        if (!chatId || !senderId) {
            return;
        }

        set((state: ChatStore) => {
            const formattedMessage: Message = {
                id: message.id,
                chatId: chatId,
                senderId: senderId,
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

    loadCachedMessages: async (chatId: number) => {
        try {
            const state = get();
            const existingChat = state.chats.find(chat => chat.id === chatId);
            
            // Load messages if chat exists but has no messages or empty messages array
            if (!existingChat?.messages || existingChat.messages.length === 0) {
                const response = await axios.get(`http://localhost:5000/api/messages/get/${chatId}`);
                const messages = response.data;

                set(state => ({
                    chats: state.chats.map(chat => 
                        chat.id === chatId ? { ...chat, messages } : chat
                    ),
                    currentChat: state.currentChat?.id === chatId ? 
                        { ...state.currentChat, messages } : 
                        state.currentChat
                }));
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('Failed to load messages');
        }
    }
}));