import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import debounce from "lodash.debounce";
// import Realm from 'realms-shim'
import io from 'socket.io-client'

let view: EditorView;
const windowSearch = new URLSearchParams(window.location.search)
const room = windowSearch.get('room') || 'default'
const socket = io(`ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`, {
  query: { room }
})
socket.on('connect', () => console.debug('🐳 connected'))
socket.on('joined', (doc: string) => {
  console.debug('joined')
  actions.start(doc)
})
socket.on('disconnect', () => console.debug('🐳 disconnect'))
socket.on('update', (changes: ChangeSet) => {
  console.debug('update')
  actions.dispatch(ChangeSet.fromJSON(changes as any))
})

const syncAnnotation = Annotation.define();

interface Actions {
  dispatch: (changes: ChangeSet) => Promise<void>;
  start: (doc: string) => void;
}
const actions: Actions = {
  dispatch: async (changes: ChangeSet) => {
    await view.dispatch({ changes, annotations: syncAnnotation.of(true) });
  },
  start: (doc: string) => useEditor(doc),
};

interface DispatchEvent {
  type: "dispatch";
  data: ChangeSet;
}
interface StartEvent {
  type: "start";
  data: string;
}

async function process(message: MessageEvent) {
  const event: DispatchEvent | StartEvent = JSON.parse(message.data);
  switch (event.type) {
    case "dispatch":
      actions.dispatch(ChangeSet.fromJSON(event.data as any));
      break;
    case "start":
      actions.start(event.data as string);
      break;
  }
}

function syncDispatch(transaction: Transaction) {
  view.update([transaction]);

  if (!transaction.changes.empty && !transaction.annotation(syncAnnotation)) {
    socket.emit('update', transaction.changes.toJSON())
    // TODO: less frequently sync doc
    socket.emit('sync', view.state.doc)
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

const evaluateDocIframeDebounced = debounce(evaluateDocIframe, 500);

function useEditor(doc: string) {
  const state = EditorState.create({
    doc,
    extensions: [basicSetup, javascript()],
  });
  view = new EditorView({
    state,
    parent: document.querySelector("#editor") as Element,
    dispatch: async (transaction) => {
      syncDispatch(transaction);
      if (!transaction.changes.empty) {
        await evaluateDocIframeDebounced();
      }
    },
  });

  // evaluate immediately on page load
  evaluateDocIframe();
}
