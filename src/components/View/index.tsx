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

interface Props {
  extensions: CodeMirrorExtension[];
  initialLocalState: string;
  onOutgoing(
    doc: string | undefined,
    transaction: string,
    isSync: boolean
  ): void;
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

    if (!transaction.changes.empty) {
      this.props.onOutgoing(
        this.editor?.state.doc.toString(),
        JSON.stringify(transaction.changes.toJSON()),
        !!transaction.annotation(this.syncAnnotation)
      );
    }
  }

  render() {
    return <div ref={this.ref} class="flex-1" />;
  }
}
