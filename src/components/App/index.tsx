import React, { Component, h } from "preact";
import { Controller } from "../../Controller";
import { Persistence } from "../../Persistence";

export default class App extends Component {
  private _persistence: Persistence;
  private _controller: Controller;

  constructor() {
    super();
    this._persistence = new Persistence();
    this._controller = new Controller({ persistence: this._persistence });
  }

  componentDidMount() {
    this._controller.start();
  }

  async onShare() {
    // TODO: use preact router instead of page reload
    await this._controller.share();
  }

  render() {
    return (
      <div>
        <header>
          <button id="share" onClick={this.onShare.bind(this)}>
            Share
          </button>
        </header>
        <div id="views">
          <div id="view-js"></div>
          <div id="view-html"></div>
          <div id="view-css"></div>
        </div>
        <div id="frame"></div>
      </div>
    );
  }
}
