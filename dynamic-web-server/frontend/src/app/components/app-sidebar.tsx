'use client';

import * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button"
import { MenuItem, MenuArray } from "./menu";
import { usePathFinder } from "@/app-hooks/use-pathfinder";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AppSidebar({ auth, user, ...props }: React.ComponentProps<typeof Sidebar> & { auth: boolean; user: string; }) {
    const router = useRouter();
    const path = usePathFinder();

    function gotoPage(ref: string): void {
        router.push(ref);
    }

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex flex-col items-center justify-center w-full py-6">
                    <Button
                        variant='primary'
                        onClick={() => router.push("/")}
                        className="text-xl font-bold uppercase tracking-wide"
                    >
                        Manoj Khatri
                    </Button>
                    <div className="text-xs uppercase tracking-widest opacity-60 mt-2">
                        vibe webdev
                    </div>
                </div>
            </SidebarHeader>
            
            <SidebarContent>
                {MenuArray.map((item: MenuItem) => (
                    <SidebarGroup key={item.title} className="pb-4 last:border-0 last:pb-0 w-full flex flex-col items-center">
                        <SidebarGroupLabel className="text-base font-bold mb-4 text-center">
                            {item.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items &&
                                    item.items.map((subItem) => {
                                        if (subItem.hidden) return null;
                                        return (
                                            <SidebarMenuItem key={subItem.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={path.id === subItem.id}
                                                    className="w-full px-3 py-2 flex-col">
                                                    <Link href={subItem.href!} prefetch className="block text-center font-medium">
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
}