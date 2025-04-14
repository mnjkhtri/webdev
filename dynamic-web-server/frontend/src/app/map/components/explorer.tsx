"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export default function Explorer() {
    const [mounted, setMounted] = useState(false);
    const [isMapLoading, setIsMapLoading] = useState(true);

    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const projectionRef = useRef<d3.GeoProjection | null>(null);
    const pathRef = useRef<d3.GeoPath<any, d3.GeoPermissibleObjects> | null>(null);
    const gRef = useRef<SVGGElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- D3 Map Setup ---
    useEffect(() => {
        if (!mounted || !svgRef.current) return;

        setIsMapLoading(true);
        const svg = d3.select(svgRef.current);
        const svgNode = svgRef.current;

        // Use parent's clientWidth/Height which should be the full screen container
        // Provide fallbacks just in case
        const parentElement = svgNode.parentElement;
        const width = parentElement?.clientWidth || window.innerWidth;
        const height = parentElement?.clientHeight || window.innerHeight;

        svg.selectAll("*").remove(); // Clear previous renders

        projectionRef.current = d3.geoNaturalEarth1()
            .scale(width / 5.5) // Adjust scale based on width
            .translate([width / 2, height / 2]); // Center projection more accurately for full screen

        pathRef.current = d3.geoPath().projection(projectionRef.current);

        const g = svg.append("g");
        gRef.current = g.node();

        // --- Zoom Handler ---
        const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            g.attr("transform", event.transform.toString());
        };

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 18]) // Allow slightly more zoom-in potential
            .on("zoom", zoomed);

        svg.call(zoomBehavior);
        zoomRef.current = zoomBehavior;

        // --- Load Map Data ---
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then((worldData: any) => {
                if (!worldData || !worldData.objects || !worldData.objects.countries) {
                    throw new Error("Invalid map data format received.");
                }
                const countries = topojson.feature(worldData, worldData.objects.countries);

                // --- Render Countries ---
                g.selectAll(".country")
                    .data(countries.features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("d", pathRef.current as any)
                    .attr("fill", "#e0e0e0") // Slightly adjusted fill color
                    .attr("stroke", "#a0a0a0") // Slightly adjusted stroke color
                    .attr("stroke-width", 0.4) // Slightly thinner stroke for full screen
                    .append("title")
                    .text((d: any) => d.properties.name);

                setIsMapLoading(false);
            })
            .catch(error => {
                console.error("Error loading or rendering map data:", error);
                setIsMapLoading(false);
                // Optionally display an error overlay here
            });

        // --- Resize Handling ---
        const handleResize = () => {
             if (!svgRef.current || !projectionRef.current || !pathRef.current || !gRef.current) return;
             const currentSvgNode = svgRef.current;
             const parent = currentSvgNode.parentElement;
             // Use parent dimensions for resizing projection
             const newWidth = parent?.clientWidth || window.innerWidth;
             const newHeight = parent?.clientHeight || window.innerHeight;

             projectionRef.current
                 .scale(newWidth / 5.5) // Adjust scale
                 .translate([newWidth / 2, newHeight / 2]); // Adjust translation (center)

              pathRef.current.projection(projectionRef.current);

              // Redraw country paths smoothly
              d3.select(gRef.current).selectAll<SVGPathElement, any>(".country") // Ensure type safety for selection
                 .transition() // Add a small transition on resize redraw
                 .duration(100) // Short duration
                 .attr("d", pathRef.current as any);
        };

        // Use ResizeObserver for efficient resize detection on the SVG's parent
        const resizeObserver = new ResizeObserver(handleResize);
        if (parentElement) {
            resizeObserver.observe(parentElement);
        } else {
             // Fallback if parent isn't immediately available (less likely but safe)
             window.addEventListener('resize', handleResize);
        }


        // --- Cleanup ---
        return () => {
            if (parentElement) {
                 resizeObserver.disconnect();
            } else {
                 window.removeEventListener('resize', handleResize);
            }
            d3.select(svgRef.current).on(".zoom", null);
            zoomRef.current = null;
            projectionRef.current = null;
            pathRef.current = null;
            gRef.current = null;
        };

    }, [mounted]); // Effect runs only when mounted state changes

    // --- Zoom Button Handlers ---
    const handleZoom = (action: 'in' | 'out' | 'reset') => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = d3.select(svgRef.current);
        const zoom = zoomRef.current;
        const transitionDuration = 250;
        switch (action) {
            case 'in': svg.transition().duration(transitionDuration).call(zoom.scaleBy, 1.5); break; // Slightly faster zoom
            case 'out': svg.transition().duration(transitionDuration).call(zoom.scaleBy, 1 / 1.5); break;
            case 'reset': svg.transition().duration(transitionDuration).call(zoom.transform, d3.zoomIdentity); break;
        }
    };

    // Only render map container once mounted client-side
    if (!mounted) {
        // You could return null or a minimal loader here if needed,
        // but the main loader handles the map loading state after mount.
        return null;
    }

    return (
        // Main container takes full screen, prevents overflow
        <div className="w-screen h-screen overflow-hidden bg-background relative">
            {/* Map container takes full space within the main container */}
            {/* The SVG will be sized relative to this div */}
             {/* Loading Overlay */}
            {isMapLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /> {/* Slightly larger loader */}
                    <p className="text-lg font-semibold">Loading World Map...</p>
                </div>
            )}

            {/* SVG Container for D3 Map */}
            <svg
                ref={svgRef}
                width="100%" // Take full width of parent
                height="100%" // Take full height of parent
                className="block" // Prevents potential extra space below SVG
            />

            {/* Zoom Controls - positioned absolutely relative to the main div */}
            <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-10"> {/* Adjusted positioning slightly */}
                 <Button variant="outline" size="icon" onClick={() => handleZoom('in')} aria-label="Zoom In">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('out')} aria-label="Zoom Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </Button>
                 <Button variant="outline" size="icon" onClick={() => handleZoom('reset')} aria-label="Reset Zoom">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>
                </Button>
            </div>
        </div>
    );
}