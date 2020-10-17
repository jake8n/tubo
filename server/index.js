const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: process.env.SNOWPACK_PUBLIC_WSS_PORT,
});

const doc = `<!doctype html>
<html>
  <body>
    <h1>Hello world</h1>
    <h2>Hello world</h2>
  </body>
</html>`;

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "start",
      data: doc,
    })
  );
  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
