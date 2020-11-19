import React, { Component, h } from "preact";
import { nanoid } from "nanoid";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { KeyManager } from "../../KeyManager";
import { Socket } from "../../Socket";
import Frame from "../Frame";
import View from "../View";
import { Extension as CodeMirrorExtension } from "@codemirror/next/state";

type Extension = "js" | "html" | "css";
interface ViewConfig {
  extension: Extension;
  extensions: CodeMirrorExtension[];
}
interface Props {}
interface State {
  isUsingSocket: boolean;
  isSocketReady: boolean;
  js: string;
  html: string;
  css: string;
}

export default class Tubo extends Component<Props, State> {
  keyManager: KeyManager;
  objectKey: string;
  room: string;
  socket: Socket;
  views: ViewConfig[] = [
    {
      extension: "js",
      extensions: [javascript()],
    },
    {
      extension: "html",
      extensions: [html()],
    },
    {
      extension: "css",
      extensions: [css()],
    },
  ];

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
        js: "",
        html: "",
        css: "",
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
    this.socket.unsecureEmit("join-room", this.room);
  }

  onOutgoingGenerator(extension: Extension) {
    return (doc: string) => {
      this.setState({
        [extension]: doc,
      });
    };
  }

  render(
    {},
    state: {
      js: string;
      html: string;
      css: string;
      isUsingSocket: boolean;
      isSocketReady: boolean;
    }
  ) {
    if (state.isUsingSocket === state.isSocketReady) {
      return (
        <div>
          <button onClick={this.onShare.bind(this)}>Share</button>
          <div class="flex">
            {this.views.map(({ extension, extensions }) => (
              <View
                extension={extension}
                extensions={extensions}
                initialLocalState={state[extension]}
                onOutgoing={this.onOutgoingGenerator(extension)}
                socket={this.socket}
              />
            ))}
          </div>
          <Frame js={state.js} html={state.html} css={state.css} />
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}
