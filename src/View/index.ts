import {
  basicSetup,
  EditorState,
  EditorView,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import { Annotation, ChangeSet, Transaction } from "@codemirror/next/state";
import { Frame } from "../Frame";
import { Socket } from "../Socket";

interface ViewConfig {
  doc: string;
  frame: Frame;
  socket?: Socket;
  parent: Element;
}

export class View {
  #frame: Frame;
  #socket: Socket | null;
  #doc: string;
  #state: EditorState;
  #parent: Element;
  view: EditorView;

  constructor(config: ViewConfig) {
    this.#frame = config.frame;
    this.#socket = config.socket ? config.socket : null;
    this.#doc = config.doc;
    this.#state = EditorState.create({
      doc: this.#doc,
      extensions: [basicSetup, javascript()],
    });
    this.#parent = config.parent;
    this.view = new EditorView({
      state: this.#state,
      parent: this.#parent,
      dispatch: this.onDispatch.bind(this),
    });
  }

  onDispatch(transaction: Transaction) {
    this.syncDispatch(transaction);
    if (
      !transaction.changes.empty &&
      !transaction.annotation(Annotation.define())
    ) {
      this.#frame.js = (this.view.state.doc as unknown) as string;

      if (this.#socket) {
        this.#socket.emit(
          "update",
          JSON.stringify(transaction.changes.toJSON())
        );
        // TODO: less frequently sync
        this.#socket.emit("sync", JSON.stringify(this.view.state.doc));
      }
    }
  }

  syncDispatch(transaction: Transaction) {
    this.view.update([transaction]);
  }

  dispatch(changes: ChangeSet) {
    this.view.dispatch({ changes, annotations: Annotation.define().of(true) });
  }
}
