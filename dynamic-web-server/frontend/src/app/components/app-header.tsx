'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathFinder } from "@/hooks/use-pathfinder";
import { Fragment } from "react";

export function AppHeader() {
    const currentPath = usePathFinder();

    if (currentPath.path.length === 0) {
        return (
            <header className="flex items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-2 shrink-0">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
        );
    }

    return (
        <header className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2 shrink-0">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>

                        {currentPath.path.map((item, index) => {
                            if (index === currentPath.path.length - 1) return;
                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem >
                                        <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                </Fragment>
                            );
                        })}

                        <BreadcrumbItem>
                            <BreadcrumbPage>{currentPath.path[currentPath.path.length - 1].title}</BreadcrumbPage>
                        </BreadcrumbItem>


                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    );
}