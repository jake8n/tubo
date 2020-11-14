import React, { Component, h } from "preact";
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
import { Ref, useRef } from "preact/hooks";

interface Props {
  extensions: Extension[];
  initialState: string;
  onOutgoing: Function;
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
    const state = EditorState.create({
      doc: this.props.initialState,
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
        transaction,
        transaction.annotation(this.syncAnnotation)
      );
    }
  }

  render() {
    return <div ref={this.ref} class="flex-1" />;
  }
}
