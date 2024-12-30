import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";

interface Contact {
    id: string;
    username: string;
    email: string;
}

interface ContactStore {
    contacts: Contact[];
    loading: boolean;
    getContacts: () => Promise<void>;
    addContact: (email: string) => Promise<void>;
}

export const useContactStore = create<ContactStore>((set) => ({
    contacts: [],
    loading: false,

    getContacts: async () => {
        set({ loading: true });
        try {
            const response = await axios.get<Contact[]>(
                "http://localhost:5000/api/contacts/getcontacts",
                { withCredentials: true }
            );
            set({ contacts: response.data, loading: false });
        } catch (error) {
            const axiosError = error as AxiosError<{ msg: string }>;
            toast.error(axiosError.response?.data?.msg || "Failed to fetch contacts");
            set({ loading: false });
        }
    },

    addContact: async (email: string) => {
        set({ loading: true });
        try {
            const response = await axios.post<Contact>(
                "http://localhost:5000/api/contacts/createcontact",
                { email },
                { withCredentials: true }
            );
            set((state) => ({
                contacts: [...state.contacts, response.data],
                loading: false
            }));
            toast.success("Contact added successfully");
        } catch (error) {
            const axiosError = error as AxiosError<{ msg: string }>;
            toast.error(axiosError.response?.data?.msg || "Failed to add contact");
            set({ loading: false });
        }
    }
}));
