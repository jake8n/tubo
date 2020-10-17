import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { html } from "@codemirror/next/lang-html";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";

let view: EditorView;
const ws = new WebSocket(
  `ws://localhost:${(import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT}`
);
ws.onopen = () => console.log("connected 🎉");
// TODO: onclose attempt to reconnect
ws.onmessage = process;
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

function syncDispatch() {
  return (transaction: Transaction) => {
    view.update([transaction]);
    if (!transaction.changes.empty && !transaction.annotation(syncAnnotation)) {
      ws.send(
        JSON.stringify({
          type: "dispatch",
          data: transaction.changes.toJSON(),
        })
      );
    }
  };
}

function useEditor(doc: string) {
  const state = EditorState.create({
    doc,
    extensions: [basicSetup, html()],
  });
  view = new EditorView({
    state,
    parent: document.querySelector("#editor") as Element,
    dispatch: syncDispatch(),
  });
}
