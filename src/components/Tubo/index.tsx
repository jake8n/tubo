import React, { Component, h } from "preact";
import { nanoid } from "nanoid";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { KeyManager } from "../../KeyManager";
import { Socket } from "../../Socket";
import Frame from "../Frame";
import View from "../View";
import { useRef } from "preact/hooks";

type Extension = "js" | "html" | "css";

export default class Tubo extends Component {
  keyManager: KeyManager;
  objectKey: string;
  room: string;
  socket: Socket;
  jsRef = useRef();
  htmlRef = useRef();
  cssRef = useRef();

  constructor() {
    super();
    const [room, objectKey] = window.location.hash.slice(1).split(",");
    this.keyManager = new KeyManager();
    this.objectKey = objectKey;
    this.room = room;
    this.socket = new Socket(
      (import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI
    );

    if (this.room.length && this.objectKey.length) {
      this.state = {
        isUsingSocket: true,
        isSocketReady: false,
      };
      this.useSocket();
    } else {
      this.state = {
        isUsingSocket: false,
        isSocketReady: false,
        js: "",
        html: "",
        css: "",
      };
    }
  }

  async onShare() {
    this.room = nanoid();
    await this.keyManager.generate();
    this.objectKey = await this.keyManager.export();
    history.replaceState(null, "", `#${this.room},${this.objectKey}`);
    await this.useSocket();
  }

  async useSocket() {
    this.setState({
      isUsingSocket: true,
    });
    await this.keyManager.import(this.objectKey);
    this.socket.key = this.keyManager.key as CryptoKey;
    this.socket.open();
    this.socket.once("room-created", () => {
      this.setState({
        isSocketReady: true,
      });
    });
    this.socket.once("room-joined", (state: string) => {
      const { html, css, js } = JSON.parse(state);
      this.setState({
        js,
        html,
        css,
        isSocketReady: true,
      });
    });
    this.socket.on("request-for-state", () => {
      this.socket.emit("response-for-state", JSON.stringify(this.state));
    });
    this.socket.on("transaction", (transaction: string) => {
      const {
        extension,
        changes,
      }: { extension: Extension; changes: string } = JSON.parse(transaction);
      // @ts-ignore
      this[extension + "Ref"].current.incoming(changes);
    });
    this.socket.unsecureEmit("join-room", this.room);
  }

  onOutgoingGenerator(extension: Extension) {
    return (doc: string, changes: string, isSync: boolean) => {
      this.setState({
        [extension]: doc,
      });
      if (this.socket.client && !isSync) {
        this.socket.emit(
          "transaction",
          JSON.stringify({
            extension,
            changes,
          })
        );
      }
    };
  }

  render(
    {},
    {
      js: JS,
      html: HTML,
      css: CSS,
      isUsingSocket,
      isSocketReady,
    }: {
      js: string;
      html: string;
      css: string;
      isUsingSocket: boolean;
      isSocketReady: boolean;
    }
  ) {
    if (isUsingSocket === isSocketReady) {
      return (
        <div>
          <button onClick={this.onShare.bind(this)}>Share</button>
          <div class="flex">
            <View
              ref={this.jsRef}
              extensions={[javascript()]}
              initialLocalState={JS}
              onOutgoing={this.onOutgoingGenerator("js")}
            />
            <View
              ref={this.htmlRef}
              extensions={[html()]}
              initialLocalState={HTML}
              onOutgoing={this.onOutgoingGenerator("html")}
            />
            <View
              ref={this.cssRef}
              extensions={[css()]}
              initialLocalState={CSS}
              onOutgoing={this.onOutgoingGenerator("css")}
            />
          </div>
          <Frame js={JS} html={HTML} css={CSS} />
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}
