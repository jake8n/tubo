import { Frame } from "./src/Frame";
import { Socket } from "./src/Socket";
import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import debounce from "lodash.debounce";
import { KeyManager } from "./src/KeyManager";

const frame = new Frame({
  parent: document.querySelector("#iframe") as Element,
  body: '<div id="app"></div>',
  css: "body { font-family: sans-serif; }",
});

let socket: Socket;
let view: EditorView;

async function start() {
  const keyManager = new KeyManager();
  await keyManager.import(window.location.hash.slice("#key=".length));
  const room =
    new URLSearchParams(window.location.search).get("room") || "default";
  socket = new Socket({
    uri: `ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`,
    room,
    key: keyManager.key as CryptoKey,
  });
  socket.open();
  // TODO: remove current editor when reconnecting (e.g. if server restarts)
  // TODO: detect no room in URL (only local development)
  socket.on("connect", () => console.debug("🐳 connected"));
  socket.on("joined", (doc: string[]) => {
    console.debug("joined");
    if (doc) {
      useEditor(doc.join("\n"));
    } else {
      useEditor(`import Vue from 'https://cdn.skypack.dev/vue@2.6.12/dist/vue.esm.browser.js'
  
  // turn off console logs 👿
  Vue.config.productionTip = false
  Vue.config.devtools = false
  
  const app = new Vue({
    el: '#app',
    data: {
      count: 1
    },
    methods: {
      increment () {
        this.count++
      }
    },
    template: \`
    <div>
      <h1>{{ count }}</h1>
      <button @click="increment">Increment</button>
    </div>
  \`
  })`);
    }
    socket.on("disconnect", () => console.debug("🐳 disconnect"));
    socket.on("update", async (changes: any) => {
      console.debug("update", { changes });
      changes = ChangeSet.fromJSON(changes);
      view.dispatch({
        changes,
        annotations: syncAnnotation.of(true),
      });
    });
  });
}

const syncAnnotation = Annotation.define();
function syncDispatch(transaction: Transaction) {
  view.update([transaction]);
  if (!transaction.changes.empty && !transaction.annotation(syncAnnotation)) {
    socket.emit("update", JSON.stringify(transaction.changes.toJSON()));
    // TODO: less frequently sync doc
    socket.emit("sync", JSON.stringify(view.state.doc));
  }
}

function renderFrame(js: string) {
  frame.js = js;
}

function useEditor(doc: string) {
  const renderFrameDebounced = debounce(renderFrame, 500);
  const state = EditorState.create({
    doc,
    extensions: [basicSetup, javascript()],
  });
  view = new EditorView({
    state,
    parent: document.querySelector("#editor") as Element,
    dispatch: (transaction: Transaction) => {
      syncDispatch(transaction);
      if (!transaction.changes.empty) {
        renderFrameDebounced((view.state.doc as unknown) as string);
      }
    },
  });
  // evaluate immediately on page load
  renderFrame((view.state.doc as unknown) as string);
}

start();
