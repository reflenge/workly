"use client";

import { create } from "zustand";
import { PublicUser } from "@/lib/auth/requireUser";

type UserState = {
    user: PublicUser | null;
    setUser: (u: PublicUser | null) => void;
};

export const createUserStore = (initial?: Partial<UserState>) =>
    create<UserState>((set) => ({
        user: initial?.user ?? null,
        setUser: (u) => set({ user: u }),
    }));

// シングルトンStore（アプリ全体で1つ）
let store: ReturnType<typeof createUserStore> | null = null;

export const getUserStore = (initial?: Partial<UserState>) => {
    if (!store) {
        store = createUserStore(initial);
    } else if (initial?.user) {
        // SSR→CSRの初回だけ初期値を反映
        store.setState({ user: initial.user });
    }
    return store;
};
