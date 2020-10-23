import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import debounce from "lodash.debounce";
// import Realm from 'realms-shim'
import io from "socket.io-client";

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
    console.debug('decrypted', decrypted)
    await useEditor(JSON.parse(decrypted).join('\n'));
  } else {
    await useEditor("");
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

// TODO: understand limitations e.g. async + import
// https://agoric.com/realms-shim-security-updates/
// const r = Realm.makeRootRealm();
// async function evaluateDoc() {
//   const outputElement = document.querySelector("#output") as Element;
//   const { doc } = view.state;
//   try {
//     const output = await r.evaluate(doc, {
//       fetch: (input: RequestInfo, init?: RequestInit) => fetch(input, init),
//       log: (...args: any[]) => {
//         console.log(...args)
//       },
//     });
//     outputElement.innerHTML = output;
//   } catch (err) {
//     console.debug(err);
//     outputElement.innerHTML = err;
//   }
// }

async function evaluateDocIframe() {
  const iframes = document.querySelector("#iframes");
  while (iframes?.firstChild) {
    iframes.removeChild(iframes.firstChild);
  }
  const iframeElement = document.createElement("iframe");
  const { doc } = view.state;
  // TODO: html should be configurable
  const html = `<body>
  <div id="app"></div>
  <script type="module">${doc}</script>
</body>`;
  iframes?.appendChild(iframeElement);
  iframeElement.contentWindow?.document.open();
  iframeElement.contentWindow?.document.write(html);
  iframeElement.contentWindow?.document.close();
}

async function useEditor(doc: string) {
  const evaluateDocIframeDebounced = debounce(evaluateDocIframe, 500);
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
        await evaluateDocIframeDebounced();
      }
    },
  });
  // evaluate immediately on page load
  await evaluateDocIframe();
}
