"use client";

import dynamic from 'next/dynamic';
const P5Wrapper = dynamic(() => import('@/components/p5wrap'), { ssr: false });
import HomeSketch from './sketch';

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center p-0">
      <P5Wrapper
        sketch={HomeSketch}
      />
    </main>
  );
}