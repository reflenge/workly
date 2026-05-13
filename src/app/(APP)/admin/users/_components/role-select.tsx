"use client";

import { userRole } from "@/db/schema";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RoleSelectProps {
    id: string;
    value: number;
    onChange: (roleId: number) => void;
    userRoles: (typeof userRole.$inferSelect)[];
}

export function RoleSelect({
    id,
    value,
    onChange,
    userRoles,
}: RoleSelectProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id}>役職</Label>
            <Select
                value={String(value)}
                onValueChange={(v) => {
                    const role = userRoles.find((r) => String(r.id) === v);
                    if (role) onChange(role.id);
                }}
            >
                <SelectTrigger id={id}>
                    <SelectValue placeholder="役職を選択" />
                </SelectTrigger>
                <SelectContent>
                    {userRoles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                            {role.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
