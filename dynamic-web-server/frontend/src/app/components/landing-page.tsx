"use client";

import { useQuery } from "@tanstack/react-query";
import { getData } from "@/lib/fetchers";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
    <div
      className="flex flex-col items-center justify-center min-h-screen
      text-black dark:text-white"
    >
      <h1 className="text-3xl font-extrabold animate-bounce">
        {data?.message || "Loading..."}
      </h1>

      <p className="mt-4 text-lg"></p>

      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="mt-6 px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-black dark:text-white shadow-md hover:scale-105 transition"
        >
          clickly ({theme})
        </button>
      )}
    </div>
  );
}