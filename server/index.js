const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: process.env.SNOWPACK_PUBLIC_WSS_PORT,
});

let doc = ``;

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "start",
      data: doc,
    })
  );
  ws.on("message", (message) => {
    const { type, data } = JSON.parse(message);

    switch (type) {
      case "dispatch":
        // relay message to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
        break;
      case "doc":
        // sync doc for new connecting clients
        doc = data.join("\n");
        break;
    }
  });
});
