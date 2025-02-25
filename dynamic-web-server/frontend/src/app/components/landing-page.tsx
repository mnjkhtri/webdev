// app/landing-page.tsx (Client Component)
"use client"; // This line ensures the component is rendered on the client

import React from "react";
import { useTheme } from "next-themes";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen
      text-black 
      dark:text-white"
    >
      <h1 className="text-3xl font-extrabold drop-shadow-lg animate-bounce">
        thanks claude lol
      </h1>

      <p className="mt-4 text-lg">
      </p>
    </div>
  );
}