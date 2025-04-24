"use client";

import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

// Interface for the component's props
interface P5WrapperProps {
  sketch: (p: p5) => void; // The user's p5 sketch function
  width?: number;          // Optional fixed width for the canvas
  height?: number;         // Optional fixed height for the canvas
}

const P5Wrapper: React.FC<P5WrapperProps> = ({ sketch, width, height }) => {
  // Ref for the container div
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to hold the p5 instance
  const sketchInstance = useRef<p5 | null>(null);

  useEffect(() => {
    // Use a local variable for the instance inside the effect scope
    let P5Instance: p5 | null = null;

    if (containerRef.current) {
      // Create a sketch function that wraps the user's sketch
      // This allows us to control the canvas creation centrally
      const sketchWithSetupOverride = (p: p5) => {

        // First, let the original sketch function run.
        // This attaches all the methods like draw, mousePressed, etc., to 'p'.
        sketch(p);

        // Keep a reference to the original setup function if the user provided one.
        // Use an empty function as a fallback if no setup was defined.
        const originalSetup = p.setup || (() => {});

        // Override the p.setup function
        p.setup = () => {
          if (containerRef.current) {
            // Determine canvas dimensions: use props if provided, else use container size
            const canvasWidth = width ?? containerRef.current.offsetWidth;
            const canvasHeight = height ?? containerRef.current.offsetHeight;

            // Create the canvas with the determined dimensions
            p.createCanvas(canvasWidth, canvasHeight);
          } else {
            // Fallback if ref becomes null unexpectedly (unlikely but safe)
            // Use provided props or a small default size
            p.createCanvas(width ?? 100, height ?? 100);
          }

          // Now, call the user's original setup function
          // Use .call() or .apply() if the original setup relies on 'this' context,
          // although typically p5 instance methods are passed 'p' explicitly.
          originalSetup();
        };
      };

      // Instantiate p5 with our overridden sketch function and the container ref
      P5Instance = new p5(sketchWithSetupOverride, containerRef.current);
      sketchInstance.current = P5Instance; // Store the instance in the ref for cleanup access
    }

    // Cleanup function: This runs when the component unmounts or dependencies change
    return () => {
      P5Instance?.remove();       // Remove the p5 instance cleanly
      sketchInstance.current = null; // Clear the ref
    };

    // Add sketch, width, and height to the dependency array.
    // The effect will re-run if any of these change.
  }, [sketch, width, height]);

  // Determine the style for the container div
  const containerStyle: React.CSSProperties = {};
  let containerClassName = "";

  if (width && height) {
    // If width and height are provided, use inline styles for fixed dimensions
    containerStyle.width = `${width}px`;
    containerStyle.height = `${height}px`;
    containerStyle.overflow = 'hidden'; // Prevent scrollbars if sketch draws slightly outside
  } else {
    // Otherwise, use Tailwind classes for full size
    containerClassName = "w-full h-full";
  }

  // Render the container div
  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={containerClassName}
    />
  );
};

export default P5Wrapper;