import React, { Component, h } from "preact";
import { Ref, useRef } from "preact/hooks";
import {
  basicSetup,
  EditorState,
  EditorView,
} from "@codemirror/next/basic-setup";
import {
  Annotation,
  AnnotationType,
  ChangeSet,
  Extension as CodeMirrorExtension,
  Transaction,
} from "@codemirror/next/state";
import { Socket } from "../Socket";

interface Props {
  extension: string;
  extensions: CodeMirrorExtension[];
  initialLocalState: string;
  onOutgoing(doc: string | undefined): void;
  socket: Socket;
}

export default class View extends Component<Props> {
  editor?: EditorView;
  ref: Ref<HTMLDivElement>;
  syncAnnotation: AnnotationType<unknown>;

  constructor() {
    super();
    this.ref = useRef();
    this.syncAnnotation = Annotation.define();
  }

  componentDidMount() {
    this.useView();
    if (this.props.socket.client) {
      this.props.socket.on("transaction", (transaction: string) => {
        const {
          extension,
          changes,
        }: { extension: string; changes: string } = JSON.parse(transaction);
        if (extension === this.props.extension) this.incoming(changes);
      });
    }
  }

  componentWillUnmount() {
    this.editor?.destroy();
  }

  incoming(changes: string) {
    this.editor?.dispatch({
      changes: ChangeSet.fromJSON(JSON.parse(changes)),
      annotations: this.syncAnnotation.of(true),
    });
  }

  useView() {
    const state = EditorState.create({
      doc: this.props.initialLocalState,
      extensions: [basicSetup, ...(this.props.extensions || [])],
    });
    this.editor = new EditorView({
      state,
      parent: this.ref.current,
      dispatch: this.dispatch.bind(this),
    });
  }

  dispatch(transaction: Transaction) {
    this.editor?.update([transaction]);
    this.props.onOutgoing(this.editor?.state.doc.toString());

    if (
      !transaction.changes.empty &&
      !transaction.annotation(this.syncAnnotation) &&
      this.props.socket.client
    ) {
      this.props.socket.emit(
        "transaction",
        JSON.stringify({
          extension: this.props.extension,
          changes: JSON.stringify(transaction.changes.toJSON()),
        })
      );
    }
  }

  render() {
    return <div ref={this.ref} class="flex-1" />;
  }
}
