"use client";

import type React from "react";

export default function AuthLayout({children,}: {
    children: React.ReactNode;
}) {
    return (
        <div className="">
            {children}
        </div>
    );
}