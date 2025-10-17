"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

type PageHeaderContextValue = {
    title: string;
    description: string;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const setTitleStable = useCallback((value: string) => setTitle(value), []);
    const setDescriptionStable = useCallback(
        (value: string) => setDescription(value),
        []
    );

    const value = useMemo<PageHeaderContextValue>(
        () => ({
            title,
            description,
            setTitle: setTitleStable,
            setDescription: setDescriptionStable,
        }),
        [title, description, setTitleStable, setDescriptionStable]
    );

    return (
        <PageHeaderContext.Provider value={value}>
            {children}
        </PageHeaderContext.Provider>
    );
}

export function usePageHeader(): PageHeaderContextValue {
    const ctx = useContext(PageHeaderContext);
    if (!ctx) {
        throw new Error(
            "usePageHeader must be used within a PageHeaderProvider"
        );
    }
    return ctx;
}
