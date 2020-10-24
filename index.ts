import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import debounce from "lodash.debounce";
import io from "socket.io-client";
import { Frame } from "./src/Frame";

const frame = new Frame({
  parent: document.querySelector("#iframe") as Element,
  body: '<div id="app"></div>',
  css: "body { font-family: sans-serif; }",
});

let view: EditorView;
let key: CryptoKey;
const syncAnnotation = Annotation.define();

const windowSearch = new URLSearchParams(window.location.search);
const room = windowSearch.get("room") || "default";
const socket = io(
  `ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`,
  {
    query: { room },
  }
);
socket.on("connect", () => console.debug("🐳 connected"));
socket.on("joined", async (doc: string) => {
  // TODO: remove current editor when reconnecting (e.g. if server restarts)
  // TODO: detect no room in URL (only local development)
  console.debug("joined", { doc });
  const objectKey = window.location.hash.slice("#key=".length);
  if (objectKey) {
    key = await window.crypto.subtle.importKey(
      "jwk",
      {
        k: objectKey,
        alg: "A128GCM",
        ext: false,
        key_ops: ["encrypt", "decrypt"],
        kty: "oct",
      },
      { name: "AES-GCM", length: 128 },
      false,
      ["encrypt", "decrypt"]
    );
    console.debug("imported key", key);
  } else {
    // TODO: if no key, don't create web socket
    key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 128 },
      true,
      ["encrypt", "decrypt"]
    );
    window.location.hash =
      "#key=" + (await window.crypto.subtle.exportKey("jwk", key)).k;
    console.debug("generated key", key);
  }
  if (doc) {
    const decrypted = await decrypt(key, doc);
    console.debug("decrypted", decrypted);
    await useEditor(JSON.parse(decrypted).join("\n"));
  } else {
    await useEditor(`import Vue from 'https://cdn.skypack.dev/vue@2.6.12/dist/vue.esm.browser.js'

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
});
socket.on("disconnect", () => console.debug("🐳 disconnect"));
socket.on("update", async (changes: ChangeSet) => {
  console.debug("update", { changes });
  const decrypted = await decrypt(key, changes);
  const parsed = JSON.parse(decrypted);
  changes = ChangeSet.fromJSON(parsed);
  await view.dispatch({
    changes,
    annotations: syncAnnotation.of(true),
  });
});

async function encrypt(key: CryptoKey, content: any) {
  return await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) /* don't reuse key! */ },
    key,
    new TextEncoder().encode(content)
  );
}

async function decrypt(key: CryptoKey, content: any) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    key,
    content
  );
  const decoded = new window.TextDecoder().decode(new Uint8Array(decrypted));
  return decoded;
}

async function syncDispatch(transaction: Transaction) {
  view.update([transaction]);
  if (!transaction.changes.empty && !transaction.annotation(syncAnnotation)) {
    socket.emit(
      "update",
      await encrypt(key, JSON.stringify(transaction.changes.toJSON()))
    );
    // TODO: less frequently sync doc
    socket.emit("sync", await encrypt(key, JSON.stringify(view.state.doc)));
  }
}

function renderFrame(js: string) {
  frame.js = js;
  console.log(frame.iframe.contentDocument?.body.innerHTML);
}

async function useEditor(doc: string) {
  const renderFrameDebounced = debounce(renderFrame, 500);
  const state = EditorState.create({
    doc,
    extensions: [basicSetup, javascript()],
  });
  view = new EditorView({
    state,
    parent: document.querySelector("#editor") as Element,
    dispatch: async (transaction) => {
      await syncDispatch(transaction);
      if (!transaction.changes.empty) {
        renderFrameDebounced((view.state.doc as unknown) as string);
      }
    },
  });
  // evaluate immediately on page load
  renderFrame((view.state.doc as unknown) as string);
}
