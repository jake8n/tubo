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
import { html } from "@codemirror/next/lang-html";
import { javascript } from "@codemirror/next/lang-javascript";
import { css } from "@codemirror/next/lang-css";
import { Socket } from "../Socket";

interface Props {
  path: string;
  lang: "html" | "javascript" | "css";
  doc: string;
  onOutgoing(doc: string | undefined): void;
  socket: Socket;
}

interface TransactionEvent {
  path: string;
  changes: string;
}

const langExtensionMap = {
  html,
  javascript,
  css,
};

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
        const { path, changes }: TransactionEvent = JSON.parse(transaction);
        if ((this.props.path = path)) this.incoming(changes);
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
      doc: this.props.doc,
      extensions: [basicSetup, langExtensionMap[this.props.lang]()],
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
          path: this.props.path,
          changes: JSON.stringify(transaction.changes.toJSON()),
        } as TransactionEvent)
      );
    }
  }

  render() {
    return <div ref={this.ref} class="bg-white h-full overflow-x-auto" />;
  }
}
