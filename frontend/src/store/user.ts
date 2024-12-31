import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Socket, io } from "socket.io-client";

axios.defaults.withCredentials = true;

interface User {
    id: string;
    username: string;
    email: string;
}

interface UserStore {
    user: User | null;
    loading: boolean;
    checkingAuth: boolean;
    socket: Socket | null;
    signup: (params: { username: string; email: string; password: string; }) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    initSocket: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: true,
    socket: null,

    initSocket: () => {
        const socket = io('http://localhost:5000', {
            transports: ['websocket'],
            withCredentials: true,
        });

        socket.on('connect', () => {
            console.log('Socket connected');
            const user = get().user;
            if (user) {
                socket.emit('user_online', user.id);
            }
        });

        set({ socket });
    },

    signup: async ({ username, email, password }) => {
        set({ loading: true });
        try {
            const res = await axios.post<User>(
                "http://localhost:5000/api/auth/signup",
                { username, email, password },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            set({ user: res.data, loading: false });
            get().initSocket();
        } catch (error) {
            set({ loading: false });
            const axiosError = error as AxiosError<{ message: string }>;
            if (axiosError.message.includes('Unexpected end of JSON input')) {
                toast.error('Invalid request format. Please try again.');
            } else {
                toast.error(axiosError.response?.data?.message || "An error occurred");
            }
        }
    },

    login: async (email, password) => {
        set({ loading: true });
        try {
            const res = await axios.post<User>(
                "http://localhost:5000/api/auth/login",
                { email, password },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
                
            );
            console.log('Login ', res.data);
            set({ user: res.data, loading: false });
            get().initSocket();
        } catch (error) {
            set({ loading: false });
            const axiosError = error as AxiosError<{ message: string }>;
            if (axiosError.message.includes('Unexpected end of JSON input')) {
                toast.error('Invalid request format. Please try again.');
            } else {
                toast.error(axiosError.response?.data?.message || "An error occurred");
            }
        }
    },

    logout: async () => {
        try {
            await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
        } catch (error) {
        } finally {
            const socket = get().socket;
            if (socket) {
                socket.disconnect();
            }
            set({ user: null, socket: null });
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            console.log('Checking authentication...');
            const response = await axios.get<User>(
                "http://localhost:5000/api/auth/authcheck", 
                { withCredentials: true }
            );
            console.log('Auth check response:', response.data);
            set({ user: response.data, checkingAuth: false });
            get().initSocket();
        } catch (error) {
            const axiosError = error as AxiosError;
            console.log('Auth check failed:', axiosError.response?.status);
            // Don't throw error, just set user to null
            set({ checkingAuth: false, user: null });
        }
    }
}));