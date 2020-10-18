import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import Realm from "realms-shim";

let view: EditorView;
const ws = new WebSocket(
  `ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`
);
ws.onopen = () => console.log("connected 🎉");
// TODO: onclose attempt to reconnect
ws.onmessage = process;

const r = Realm.makeRootRealm();

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
    ws.send(
      JSON.stringify({
        type: "dispatch",
        data: transaction.changes.toJSON(),
      })
    );
    // TODO: less frequently sync doc
    ws.send(
      JSON.stringify({
        type: "doc",
        data: view.state.doc,
      })
    );
  }
}

// TODO: understand limitations e.g. async + import
async function evaluateDoc() {
  const outputElement = document.querySelector("#output") as Element;
  const { doc } = view.state;
  try {
    const output = await r.evaluate(doc);
    outputElement.innerHTML = output;
  } catch (err) {
    console.debug(err);
    outputElement.innerHTML = err;
  }
}

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
      await evaluateDoc();
    },
  });
}
