import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex py-3 items-center justify-between px-4">
                <Skeleton className="w-full max-w-[200px] h-[20px] rounded-sm" />
            </header>
        </div>
    );
}