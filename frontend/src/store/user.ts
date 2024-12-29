import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";

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
    signup: (params: { username: string; email: string; password: string; }) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({ username, email, password }) => {
        set({ loading: true });
        try {
            const res = await axios.post<User>(
                "http://localhost:5000/api/auth/signup",
                { username, email, password },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            set({ user: res.data, loading: false });
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
            set({ user: res.data, loading: false });
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
            set({ user: null });
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const response = await axios.get<User>("http://localhost:5000/api/auth/authcheck", { withCredentials: true });
            set({ user: response.data, checkingAuth: false });
        } catch (error) {
            const axiosError = error as AxiosError;
            set({ checkingAuth: false, user: null });
        }
    }
}));