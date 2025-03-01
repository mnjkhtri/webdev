import { JSX } from "react";

export type MenuItem = {
    title: string;
    id: string;
    icon?: JSX.Element;
    external?: boolean;
    href?: string;
    items?: MenuItem[];
    isActive?: boolean;
    hidden?: boolean;
};

export const MenuArray: MenuItem[] =
    [
        {
            id: "projects",
            title: "mini projects",
            href: "#",
            items: [
                {
                    id: "todo-app",
                    title: "todo app",
                    href: "/todo-app",
                },
                {
                    id: "fractals",
                    title: "fractals",
                    href: "/fractals",
                },
                {
                    id: "feedback",
                    title: "feedback",
                    href: "/feedback",
                }
            ],
        },
    ];
