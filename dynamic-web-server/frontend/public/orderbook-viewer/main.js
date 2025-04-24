import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.4.3/dist/cdn/perspective-viewer.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace@3.4.3/dist/cdn/perspective-workspace.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.4.3/dist/cdn/perspective-viewer-datagrid.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.4.3/dist/cdn/perspective-viewer-d3fc.js";

import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.4.3/dist/cdn/perspective.js";

async function setupPerspective() {
  console.log("[DEBUG] setupPerspective() started.");

  const workspace = document.getElementById("workspace");
  if (!workspace) {
    console.error("[DEBUG] Failed to find perspective-viewer element!");
    return;
  }
  console.log("[DEBUG] perspective-viewer workspace element found.");

  try {
    // const URL = "ws://172.17.0.1:5001/orderbook";
    const URL = "ws://localhost:5001/orderbook";
    console.log(`[DEBUG] Connecting to WebSocket at ${URL}`);
    
    const websocket = await perspective.websocket(URL);
    console.log("[DEBUG] WebSocket connection established.");

    const orderbook = await websocket.open_table("orderbook");
    console.log("[DEBUG] Opened 'orderbook' table from WebSocket.");

    const req = await fetch("layout.json");
    console.log("[DEBUG] layout.json fetched successfully.");
    
    const layout = await req.json();
    console.log("[DEBUG] layout.json parsed successfully.");

    workspace.tables.set("orderbook", orderbook);
    console.log("[DEBUG] orderbook table set in workspace.");

    await workspace.restore(layout);
    console.log("[DEBUG] Workspace layout restored.");
    
  } catch (err) {
    console.error("[DEBUG] Error in WebSocket connection loading:", err);
  }
}

setupPerspective().catch(err => {
  console.error("[DEBUG] Error occurred during setupPerspective() execution:", err);
});