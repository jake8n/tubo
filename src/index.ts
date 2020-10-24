import { Frame } from "./Frame";
import { View } from "./View";

const frame = new Frame({
  parent: document.querySelector("#iframe") as Element,
  body: '<div id="app"></div>',
  css: "body { font-family: sans-serif; }",
});

new View({
  doc: "console.log('hello world')",
  frame,
  parent: document.querySelector("#editor") as Element,
});

// async function start() {
//   const keyManager = new KeyManager();
//   await keyManager.import(window.location.hash.slice("#key=".length));
//   const room =
//     new URLSearchParams(window.location.search).get("room") || "default";
//   socket = new Socket({
//     uri: `ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`,
//     room,
//     key: keyManager.key as CryptoKey,
//   });
//   socket.open();
//   // TODO: remove current editor when reconnecting (e.g. if server restarts)
//   // TODO: detect no room in URL (only local development)
//   socket.on("connect", () => console.debug("🐳 connected"));
//   socket.on("joined", (doc: string[]) => {
//     console.debug("joined");
//     let docString = doc ? doc.join('\n') : "console.log('hello world')"
//     view = new View({

//     })
//   });
//   socket.on("disconnect", () => console.debug("🐳 disconnect"));
//   socket.on("update", async (changes: any) => {
//     console.debug("update", { changes });
//     changes = ChangeSet.fromJSON(changes);
//     view.dispatch(changes);
//   });
// }
