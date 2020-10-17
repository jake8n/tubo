const Y = require("yjs");
const WebSocket = require("ws");

const ydoc = new Y.Doc();
const ytext = ydoc.getText("test");
ytext.insert(
  0,
  `<!doctype html>
<html>
  <body>
    <h1>Hello world</h1>
    <h2>Hello world</h2>
  </body>
</html>`
);

const wss = new WebSocket.Server({
  port: 6060,
});

const actions = {
  delete: ({ from, to }) => ytext.delete(from, to + 1 - from),
  insert: ([index, text]) => ytext.insert(index, text[1][0]),
};

const dispatch = (type, data) => actions[type](data);

wss.on("connection", (ws) => {
  ws.send(ytext.toString());
  ws.on("message", (message) => {
    const { type, data } = JSON.parse(message);
    console.log({ type, data });
    dispatch(type, data);
    ws.send(ytext.toString());
  });
});
