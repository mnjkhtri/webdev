"use client";

import React from "react";

const HTMLViewer = () => {
  return (
    <iframe
      src="/orderbook-viewer/index.html"
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Perspective Order Book"
    />
  );
};

export default HTMLViewer;