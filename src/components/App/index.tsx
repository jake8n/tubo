import React, { Component, h } from "preact";
import { Persistence } from "../../Persistence";
import { javascript } from "@codemirror/next/lang-javascript";
import Frame from "../Frame";
import View from "../View";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { Transaction } from "@codemirror/next/state";

// TODO: rename App to Tubo
export default class App extends Component {
  private _persistence: Persistence;

  constructor() {
    super();
    this._persistence = new Persistence();
    this.state = {
      js: this._persistence.js,
      html: this._persistence.html,
      css: this._persistence.css,
    };
  }

  // async onShare() {
  //   // TODO: use preact router instead of page reload
  //   await this._controller.share();
  // }

  onOutgoingGenerator(extension: "js" | "html" | "css") {
    return (doc: string, transaction: Transaction, isSync: boolean = false) => {
      this.setState({
        [extension]: doc,
      });
      this._persistence[extension] = doc;
    };
  }

  render(
    {},
    { js: JS, html: HTML, css: CSS }: { js: string; html: string; css: string }
  ) {
    return (
      <div>
        <div class="flex">
          <View
            initialState={this._persistence.js}
            extensions={[javascript()]}
            onOutgoing={this.onOutgoingGenerator("js")}
          />
          <View
            initialState={this._persistence.html}
            extensions={[html()]}
            onOutgoing={this.onOutgoingGenerator("html")}
          />
          <View
            initialState={this._persistence.css}
            extensions={[css()]}
            onOutgoing={this.onOutgoingGenerator("css")}
          />
        </div>
        <Frame js={JS} html={HTML} css={CSS} />
      </div>
    );
  }
}
