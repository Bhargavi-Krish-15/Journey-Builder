const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const DATA_PATH = path.join(__dirname, "data", "graph.json");

// Preload graph data once; keep it small and in-memory for simplicity.
const graphData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/action-blueprint-graph") {
    sendJson(res, 200, graphData);
    return;
  }

  if (req.method === "OPTIONS") {
    // Simple CORS preflight support.
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS"
    });
    res.end();
    return;
  }

  sendJson(res, 404, { error: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`Mock backend running at http://localhost:${PORT}`);
});
