import {
  basicSetup,
  EditorState,
  EditorView,
} from "@codemirror/next/basic-setup";
import { javascript } from "@codemirror/next/lang-javascript";
import {
  Annotation,
  AnnotationType,
  ChangeSet,
  Transaction,
} from "@codemirror/next/state";

export interface ViewConfig {
  js: string;
  parent: Element;
  outgoing: Function;
}

export class View {
  #editor: EditorView;
  #outgoing: Function;
  #syncAnnotation: AnnotationType<unknown>;

  constructor(config: ViewConfig) {
    this.#outgoing = config.outgoing;
    const state = EditorState.create({
      doc: config.js,
      extensions: [basicSetup, javascript()],
    });
    this.#editor = new EditorView({
      state,
      parent: config.parent,
      dispatch: this.dispatch.bind(this),
    });
    this.#syncAnnotation = Annotation.define();
  }

  dispatch(transaction: Transaction) {
    console.debug("View:dispatch");
    this.#editor.update([transaction]);
    if (!transaction.changes.empty) {
      this.#outgoing(
        this.#editor.state.doc,
        transaction,
        transaction.annotation(this.#syncAnnotation)
      );
    }
  }

  incoming(changes: ChangeSet) {
    this.#editor.dispatch({
      changes,
      annotations: this.#syncAnnotation.of(true),
    });
  }
}
