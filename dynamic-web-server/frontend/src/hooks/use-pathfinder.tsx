import * as React from "react";
import { MenuItem, MenuArray } from "../app/components/menu";
import { usePathname } from 'next/navigation';

type Path = {
    id: string,
    path: { title: string, href?: string; }[],
};

const defaultPath: Path = {
    id: "",
    path: [
        {
            title: "",
            href: "",
        }
    ],
};
export function usePathFinder() {
    const pathname = usePathname();
    const [currentPath, setCurrentPath] = React.useState<Path>(defaultPath);

    React.useEffect(() => {

        let pathFound = false;
        MenuArray.forEach((item: MenuItem) => {
            if (item.items) {
                item.items.forEach((subItem: MenuItem) => {
                    if (!subItem.href) return;
                    let ref = subItem.href;
                    let path = pathname;
                    if (subItem.href?.indexOf("/*") !== -1) {
                        ref = subItem.href.replace("/*", "");
                        const pathArr = pathname.split("/");
                        pathArr.pop();
                        path = pathArr.join("/");
                    }

                    if (ref === path) {
                        pathFound = true;
                        setCurrentPath({
                            id: subItem.id,
                            path: [{
                                title: item.title,
                                href: item.href,
                            }, {
                                title: subItem.title,
                                href: subItem.href,
                            }],
                        });
                    }
                });
            }
        });

        if (pathname === "/" || !pathFound) {
            setCurrentPath(defaultPath);
            return;
        }

    }, [pathname]);

    return currentPath;
};