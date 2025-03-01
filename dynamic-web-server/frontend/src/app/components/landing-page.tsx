"use client";

import { useQuery } from "@tanstack/react-query";
import { getData } from "@/lib/fetchers";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["hello"],
    queryFn: () => getData("/hello"),
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure theme is correctly applied after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Theme Toggle Button */}
      {mounted && (
        <div >
          {data?.message}
        </div>
      )}
    </div>
  );
}