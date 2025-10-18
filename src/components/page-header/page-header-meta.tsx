"use client";

import { useEffect } from "react";
import { usePageHeader } from "./page-header-context";

type Props = {
    title?: string;
    description?: string;
};

export function PageHeaderMeta({ title, description }: Props) {
    const { setTitle, setDescription } = usePageHeader();

    useEffect(() => {
        if (title !== undefined) setTitle(title);
        if (description !== undefined) setDescription(description);
    }, [title, description, setTitle, setDescription]);

    return null;
}
