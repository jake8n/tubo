import {
  basicSetup,
  EditorState,
  EditorView,
} from "@codemirror/next/basic-setup";
import {
  Annotation,
  AnnotationType,
  ChangeSet,
  Extension,
  Transaction,
} from "@codemirror/next/state";

export interface ViewConfig {
  extensions: Extension[];
  initialState: string;
  parent: Element;
  outgoing: Function;
}

export class View {
  private _editor: EditorView;
  private _outgoing: Function;
  private _syncAnnotation: AnnotationType<unknown>;

  constructor(config: ViewConfig) {
    this._outgoing = config.outgoing;
    const state = EditorState.create({
      doc: config.initialState,
      extensions: [basicSetup, ...config.extensions],
    });
    this._editor = new EditorView({
      state,
      parent: config.parent,
      dispatch: this.dispatch.bind(this),
    });
    this._syncAnnotation = Annotation.define();
  }

  dispatch(transaction: Transaction) {
    console.debug("View:dispatch");
    this._editor.update([transaction]);
    if (!transaction.changes.empty) {
      this._outgoing(
        this._editor.state.doc,
        transaction,
        transaction.annotation(this._syncAnnotation)
      );
    }
  }

  incoming(changes: ChangeSet) {
    this._editor.dispatch({
      changes,
      annotations: this._syncAnnotation.of(true),
    });
  }
}
