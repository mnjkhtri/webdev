"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function Mandelbrot() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [iterations, setIterations] = useState(100);
  const [resolution, setResolution] = useState(1);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [renderQuality, setRenderQuality] = useState("normal");
  const [activeLocation, setActiveLocation] = useState("full");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ x: 0, y: 0 });

  // Interesting Mandelbrot locations
  const interestingLocations = {
    full: { x: -0.5, y: 0, zoom: 1, name: "Full Set" },
    seahorse: { x: -0.75, y: 0.1, zoom: 50, name: "Seahorse Valley" },
    spiral: { x: -0.761574, y: -0.0847596, zoom: 200, name: "Spiral" },
    elephant: { x: 0.3015, y: -0.0200, zoom: 25, name: "Elephant Valley" },
    minibrots: { x: -1.77, y: 0, zoom: 30, name: "Mini Mandelbrots" },
    tentacles: { x: 0.28693186889504513, y: 0.012787078827452934, zoom: 100, name: "Tentacles" },
    feather: { x: -1.543577002, y: -0.000058690069, zoom: 500, name: "Feathery Edge" },
  };

  // Initialize the web worker
  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { dimensions, center, zoom, iterations, scale, resolution, renderOrder } = e.data;
        
        // Process the tiles in the specified order
        const { tiles, totalTiles } = renderOrder;
        let tileIndex = 0;
        
        function processTile() {
          if (tileIndex >= tiles.length) {
            return;
          }
          
          const tile = tiles[tileIndex];
          const { startX, startY, width, height } = tile;
          
          const data = new Uint8ClampedArray(width * height * 4);
          
          // Create a more visually appealing color palette.
          // This color palette uses multiple hues and should work decently in light or dark mode.
          const colors = [];
          for (let i = 0; i < 256; i++) {
            // Using a sine-based gradient
            const phase = i / 255;
            const r = Math.floor(128 + 127 * Math.sin(phase * 5 + 0));
            const g = Math.floor(128 + 127 * Math.sin(phase * 5 + 2));
            const b = Math.floor(128 + 127 * Math.sin(phase * 5 + 4));
            colors[i] = [r, g, b, 255];
          }

          // Calculate the Mandelbrot set for this tile
          for (let y = 0; y < height; y += resolution) {
            for (let x = 0; x < width; x += resolution) {
              const zx0 = center.x + ((startX + x) - dimensions.width / 2) * scale;
              const zy0 = center.y + ((startY + y) - dimensions.height / 2) * scale;

              let zx = 0;
              let zy = 0;
              let iteration = 0;

              while (zx * zx + zy * zy < 4 && iteration < iterations) {
                const zxTemp = zx * zx - zy * zy + zx0;
                zy = 2 * zx * zy + zy0;
                zx = zxTemp;
                iteration++;
              }

              let color;
              if (iteration === iterations) {
                // Black for points inside the set (works fine on both light/dark backgrounds)
                color = [0, 0, 0, 255];
              } else {
                // Smooth coloring
                const smoothed = iteration + 1 - Math.log(Math.log(Math.sqrt(zx * zx + zy * zy))) / Math.log(2);
                const colorIndex = Math.floor((smoothed / iterations * 255) % 255);
                color = colors[colorIndex];
              }
              
              // Fill a block of pixels for the current resolution
              for (let blockY = 0; blockY < resolution && y + blockY < height; blockY++) {
                for (let blockX = 0; blockX < resolution && x + blockX < width; blockX++) {
                  const pixelIndex = ((y + blockY) * width + (x + blockX)) * 4;
                  data[pixelIndex] = color[0];
                  data[pixelIndex + 1] = color[1];
                  data[pixelIndex + 2] = color[2];
                  data[pixelIndex + 3] = color[3];
                }
              }
            }
          }
          
          // Send the result back
          self.postMessage({
            data,
            tileIndex,
            startX: startX,
            startY: startY,
            width,
            height,
            progress: (tileIndex + 1) / totalTiles
          }, [data.buffer]);
          
          tileIndex++;
          setTimeout(processTile, 0);
        }
        
        processTile();
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      if (!canvasRef.current) return;
      
      const { data, startX, startY, width, height, progress } = e.data;
      const ctx = canvasRef.current.getContext("2d");
      const imageData = new ImageData(new Uint8ClampedArray(data), width, height);
      
      ctx.putImageData(imageData, startX, startY);
      setRenderingProgress(progress);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Update resolution/iterations for zoom thresholds
  useEffect(() => {
    if (zoom > 50) {
      setResolution(1);
      setRenderQuality("high");
    } else if (zoom > 10) {
      setResolution(1);
      setRenderQuality("normal");
    } else {
      setResolution(1);
      setRenderQuality("normal");
    }
  }, [zoom]);

  // Grab canvas parent dimensions on mount
  useEffect(() => {
    if (canvasRef.current) {
      const parent = canvasRef.current.parentElement;
      setDimensions({
        width: parent?.clientWidth || 0,
        height: parent?.clientHeight || 0
      });
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        setDimensions({
          width: parent?.clientWidth || 0,
          height: parent?.clientHeight || 0
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scale = useMemo(() => 4 / (dimensions.width * zoom), [dimensions.width, zoom]);

  // Create a center-outward rendering pattern
  const createCenterOutwardTiles = useCallback((width: number, height: number, tileSize = 64) => {
    const tiles: {
      startX: number;
      startY: number;
      width: number;
      height: number;
    }[] = [];
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);

    const centerTileX = Math.floor(tilesX / 2);
    const centerTileY = Math.floor(tilesY / 2);

    const maxDistance =
      Math.max(centerTileX, tilesX - centerTileX - 1) +
      Math.max(centerTileY, tilesY - centerTileY - 1);

    for (let distance = 0; distance <= maxDistance; distance++) {
      const distanceTiles: typeof tiles = [];

      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const tileDistance = Math.max(
            Math.abs(tx - centerTileX),
            Math.abs(ty - centerTileY)
          );
          if (tileDistance === distance) {
            const startX = tx * tileSize;
            const startY = ty * tileSize;
            const actualWidth = Math.min(tileSize, width - startX);
            const actualHeight = Math.min(tileSize, height - startY);

            distanceTiles.push({
              startX,
              startY,
              width: actualWidth,
              height: actualHeight,
            });
          }
        }
      }

      // Randomize tiles at the same distance for more uniform rendering
      for (let i = distanceTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [distanceTiles[i], distanceTiles[j]] = [distanceTiles[j], distanceTiles[i]];
      }

      tiles.push(...distanceTiles);
    }

    return { tiles, totalTiles: tiles.length };
  }, []);

  // Draw the Mandelbrot set using the web worker
  const drawMandelbrot = useCallback(() => {
    if (!canvasRef.current || !workerRef.current || dimensions.width === 0) return;

    setRenderingProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = "blur(8px)";
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    const currentScale = 4 / (dimensions.width * zoom);
    const renderOrder = createCenterOutwardTiles(dimensions.width, dimensions.height, 64);

    workerRef.current.postMessage({
      dimensions,
      center,
      zoom,
      iterations,
      scale: currentScale,
      resolution,
      renderOrder,
    });
  }, [
    dimensions,
    zoom,
    center,
    iterations,
    resolution,
    createCenterOutwardTiles,
  ]);

  // Debounce rendering to prevent excessive redraws
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;
    const timerId = setTimeout(() => {
      drawMandelbrot();
    }, 200);
    return () => clearTimeout(timerId);
  }, [dimensions, zoom, center, iterations, resolution, drawMandelbrot]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const mouseReal = center.x + (mouseX - dimensions.width / 2) * scale;
      const mouseImag = center.y + (mouseY - dimensions.height / 2) * scale;

      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
      const newZoom = zoom * zoomFactor;

      const newScale = 4 / (dimensions.width * newZoom);
      const newCenterX = mouseReal - (mouseX - dimensions.width / 2) * newScale;
      const newCenterY = mouseImag - (mouseY - dimensions.height / 2) * newScale;

      setZoom(newZoom);
      setCenter({ x: newCenterX, y: newCenterY });
      setActiveLocation("custom");
    },
    [center, dimensions, scale, zoom]
  );

  // Handle mouse click zoom
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (isDragging) return;
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const mouseReal = center.x + (mouseX - dimensions.width / 2) * scale;
      const mouseImag = center.y + (mouseY - dimensions.height / 2) * scale;

      const newZoom = zoom * 2;
      setZoom(newZoom);
      setCenter({ x: mouseReal, y: mouseImag });
      setActiveLocation("custom");
    },
    [center, dimensions, isDragging, scale, zoom]
  );

  // Handle mouse drag for panning
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragStartCenter({ ...center });
    },
    [center]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !canvasRef.current) return;
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const deltaReal = -deltaX * scale;
      const deltaImag = -deltaY * scale;

      setCenter({
        x: dragStartCenter.x + deltaReal,
        y: dragStartCenter.y + deltaImag,
      });
      setActiveLocation("custom");
    },
    [dragStart, dragStartCenter, isDragging, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Register mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleWheel, handleClick, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Handle navigation to interesting locations
  const navigateToLocation = (locationKey: string) => {
    const location = interestingLocations[locationKey];
    if (location) {
      setCenter({ x: location.x, y: location.y });
      setZoom(location.zoom);
      setActiveLocation(locationKey);
    }
  };

  // Reset handler
  const handleReset = () => {
    navigateToLocation("full");
    setIterations(100);
    setResolution(1);
    setRenderQuality("normal");
  };

  return (
    <div className="flex flex-row w-full h-full gap-4">
      {/* 
        Replace the hard-coded bg-black with a tailwind/shadcn token like 
        `bg-background` to adapt based on light/dark mode.
      */}
      <div className="relative flex-grow bg-background rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ width: "100%", height: "100%" }}
          className={isDragging ? "cursor-grabbing" : "cursor-crosshair"}
        />
        {/* Overlays with neutral background and foreground tokens */}
        {renderingProgress < 1 && (
          <div className="absolute bottom-4 left-4 p-2 rounded-md text-sm bg-muted/80 text-muted-foreground">
            Rendering: {Math.round(renderingProgress * 100)}%
          </div>
        )}
        <div className="absolute top-4 left-4 p-2 rounded-md text-sm bg-muted/80 text-muted-foreground">
          {interestingLocations[activeLocation]?.name || "Custom View"}
        </div>
        <div className="absolute bottom-4 right-4 p-2 rounded-md text-sm bg-muted/80 text-muted-foreground">
          <div>Zoom: {zoom.toFixed(1)}x</div>
        </div>
      </div>

      {/* Controls Panel */}
      <Card className="w-64 shrink-0">
        <CardHeader>
          {/* Empty or add a title if desired */}
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="locations">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.keys(interestingLocations).map((key) => (
                  <Button
                    key={key}
                    variant={activeLocation === key ? "default" : "outline"}
                    onClick={() => navigateToLocation(key)}
                    className="w-full justify-start"
                  >
                    {interestingLocations[key].name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Detail</p>
                  <p className="text-xs text-muted-foreground">
                    {iterations} iterations
                  </p>
                </div>
                <Slider
                  value={[iterations]}
                  min={50}
                  max={500}
                  step={10}
                  onValueChange={(value) => setIterations(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Quality</p>
                  <p className="text-xs text-muted-foreground">{renderQuality}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={renderQuality === "low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRenderQuality("low");
                      setResolution(3);
                    }}
                    className="flex-1"
                  >
                    Low
                  </Button>
                  <Button
                    variant={renderQuality === "normal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRenderQuality("normal");
                      setResolution(1);
                    }}
                    className="flex-1"
                  >
                    Normal
                  </Button>
                  <Button
                    variant={renderQuality === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setRenderQuality("high");
                      setResolution(1);
                      setIterations(Math.max(iterations, 200));
                    }}
                    className="flex-1"
                  >
                    High
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 pt-4">
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (canvasRef.current) {
                    const link = document.createElement("a");
                    link.download = "mandelbrot.png";
                    link.href = canvasRef.current.toDataURL();
                    link.click();
                  }
                }}
              >
                Save Image
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const keys = Object.keys(interestingLocations);
                  const randomLocation = keys[Math.floor(Math.random() * keys.length)];
                  navigateToLocation(randomLocation);
                }}
              >
                Random Location
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}