import React from 'react';

export interface FractalDefinition {
  id: string;
  name: string;
  component: JSX.Element;
}

import Mandelbrot from "./mandelbrot";
import Julia from "./julia";

// Define the fractals array with proper typing
export const fractals: FractalDefinition[] = [
  {
    id: "mandelbrot",
    name: "Mandelbrot",
    component: React.createElement(Mandelbrot),
  },
  {
    id: "julia",
    name: "Julia",
    component: React.createElement(Julia),
  },
  // Add more fractals here, e.g.:
  // {
  //   id: "burning-ship",
  //   name: "Burning Ship",
  //   component: React.createElement(BurningShip),
  // },
]