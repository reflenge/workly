"use client";

import { ReactNode, useRef } from "react";
import { getUserStore } from "./user-store";
import { PublicUser } from "@/lib/auth/requireUser";
import { createContext, useContext } from "react";
import { useStore } from "zustand";

type Store = ReturnType<typeof getUserStore>;

const UserStoreContext = createContext<Store | null>(null);

export function UserProvider({
    initialUser,
    children,
}: {
    initialUser: PublicUser;
    children: ReactNode;
}) {
    const storeRef = useRef<Store>(null);
    if (!storeRef.current) {
        storeRef.current = getUserStore({ user: initialUser });
    }
    return (
        <UserStoreContext.Provider value={storeRef.current}>
            {children}
        </UserStoreContext.Provider>
    );
}

export function useUser() {
    const store = useContext(UserStoreContext);
    if (!store) throw new Error("useUser must be used within <UserProvider/>");
    return useStore(store, (s) => s.user);
}

export function useSetUser() {
    const store = useContext(UserStoreContext);
    if (!store)
        throw new Error("useSetUser must be used within <UserProvider/>");
    return useStore(store, (s) => s.setUser);
}
