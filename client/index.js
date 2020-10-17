import {
  EditorState,
  EditorView,
  basicSetup,
} from "@codemirror/next/basic-setup";
import { html } from "@codemirror/next/lang-html";

let view;

const ws = new WebSocket("ws://localhost:6060");
ws.onopen = () => console.log("🎃");
ws.onmessage = ({ data }) => console.log(data);

function syncDispatch() {
  return (transaction) => {
    console.log(transaction);

    if (transaction.annotations[0].value === "delete") {
      const [{ from, to }] = transaction.selection.ranges;
      ws.send(
        JSON.stringify({
          type: "delete",
          data: { from, to },
        })
      );
    }

    if (transaction.changes.inserted.length) {
      ws.send(
        JSON.stringify({
          type: "insert",
          data: transaction.changes,
        })
      );
    }
    view.update([transaction]);
  };
}

let startState = EditorState.create({
  doc: `<!doctype html>
<html>
  <body>
    <h1>Hello world</h1>
    <h2>Hello world</h2>
  </body>
</html>`,
  extensions: [basicSetup, html()],
});

export function start() {
  view = new EditorView({
    state: startState,
    parent: document.querySelector("#editor"),
    dispatch: syncDispatch(),
  });
}
