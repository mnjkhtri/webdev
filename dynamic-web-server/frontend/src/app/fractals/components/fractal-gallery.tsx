"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fractals } from "./menu";

export default function FractalGallery() {
  const [activeTab, setActiveTab] = useState("mandelbrot");

  // Handle keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.getAttribute("role") === "tab") {
        const currentIndex = fractals.findIndex((f) => f.id === activeTab);
        if (e.key === "ArrowRight" && currentIndex < fractals.length - 1) {
          setActiveTab(fractals[currentIndex + 1].id);
        } else if (e.key === "ArrowLeft" && currentIndex > 0) {
          setActiveTab(fractals[currentIndex - 1].id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background rounded-lg">
      <Tabs
        defaultValue="mandelbrot"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="px-6 pt-2 flex-shrink-0">
          <TabsList>
            {fractals.map((fractal) => (
              <TabsTrigger
                key={fractal.id}
                value={fractal.id}
              >
                {fractal.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-6 pt-4">
          {fractals.map((fractal) => (
            <TabsContent
              key={fractal.id}
              value={fractal.id}
            >
              {fractal.component}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}