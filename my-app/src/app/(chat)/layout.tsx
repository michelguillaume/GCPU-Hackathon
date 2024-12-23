import { AppSidebar } from '@/components/app-sidebar';
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar';

import getSession from "@/lib/getSession";
import {redirect} from "next/navigation";
import React from "react";

export const experimental_ppr = true;

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/api/auth/signin");
    }

    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
