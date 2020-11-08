import { Persistence } from "../Persistence";
import { Frame } from "../Frame";
import { View } from "../View";
import { ChangeSet, Transaction } from "@codemirror/next/state";
import { KeyManager } from "../KeyManager";
import { Socket } from "../Socket";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";

export interface ControllerConfig {
  persistence: Persistence;
}

export class Controller {
  #frame: Frame | null = null;
  #keyManager: KeyManager;
  #objectKey: string;
  #persistence: Persistence;
  #room: string;
  #socket: Socket | null = null;
  viewJs: View | null = null;
  viewHtml: View | null = null;
  viewCss: View | null = null;

  constructor(config: ControllerConfig) {
    this.#keyManager = new KeyManager();
    this.#persistence = config.persistence;
    this.#room = this.getRoomFromWindow();
    this.#objectKey = this.getObjectKeyFromWindow();
  }

  getRoomFromWindow() {
    return new URLSearchParams(window.location.search).get("room") || "";
  }

  getObjectKeyFromWindow() {
    return window.location.hash.slice("#key=".length);
  }

  async start() {
    if (this.#room.length && this.#objectKey.length) {
      await this.#keyManager.import(this.#objectKey);
      this.setSocket();
      (this.#socket as Socket).open();
      this.registerSocketEvents();
    } else {
      this.useFrame();
      this.useViews();
    }
  }

  async share() {
    // set key on window
    await this.#keyManager.generate();
    window.location.hash = "#key=" + (await this.#keyManager.export());
    // set up socket
    this.setSocket();
    (this.#socket as Socket).open();
    this.registerSocketEvents();
    (this.#socket as Socket).emit("sync", JSON.stringify(this.#persistence.js));
    // TODO: avoid page refresh (and send current local storage to server)
    // set room on window
    const searchParams = new URLSearchParams();
    searchParams.set("room", "test");
    window.location.search = searchParams.toString();
  }

  setSocket() {
    this.#socket = new Socket({
      uri: (import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI,
      room: this.#room,
      key: this.#keyManager.key as CryptoKey,
    });
  }

  registerSocketEvents() {
    console.debug("Controller:registerSocketEvents");
    this.useFrame();
    this.useViews();
    ["Js", "Html", "Css"].forEach((value) => {
      if (!this.#socket) return;
      this.#socket.on(`init:${value.toLowerCase()}`, (doc: string[]) => {
        console.debug("Controller:init");
        // @ts-ignore
        this.#persistence[value.toLowerCase()] = doc ? doc.join("\n") : "";
      });
      this.#socket.on(`update:${value.toLowerCase()}`, (json: JSON) => {
        console.debug("Controller:incoming");
        // @ts-ignore
        console.log(this["viewHtml"]);
        // @ts-ignore
        if (!this[`view${value}`]) return;
        const changes = ChangeSet.fromJSON(json as any);
        // @ts-ignore
        this[`view${value}`].incoming(changes);
      });
    });
  }

  useFrame() {
    this.#frame = new Frame({
      js: this.#persistence.js,
      html: this.#persistence.html,
      css: this.#persistence.css,
      parent: document.querySelector("#frame") as Element,
    });
  }

  useViews() {
    this.viewJs = new View({
      extensions: [javascript()],
      initialState: this.#persistence.js,
      outgoing: this.outgoingJs.bind(this),
      parent: document.querySelector("#view-js") as Element,
    });
    this.viewHtml = new View({
      extensions: [html()],
      initialState: this.#persistence.html,
      outgoing: this.outgoingHtml.bind(this),
      parent: document.querySelector("#view-html") as Element,
    });
    this.viewCss = new View({
      extensions: [css()],
      initialState: this.#persistence.css,
      outgoing: this.outgoingCss.bind(this),
      parent: document.querySelector("#view-css") as Element,
    });
  }

  outgoingJs(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this.#frame) return;
    this.#frame.js = doc;
    this.#persistence.js = doc;
    if (!this.#socket || isSync) return;
    console.debug("Controller:outgoing");
    this.#socket.emit(
      "update:js",
      JSON.stringify(transaction.changes.toJSON())
    );
    this.#socket.emit("sync:js", JSON.stringify(doc));
  }

  outgoingHtml(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this.#frame) return;
    this.#frame.html = doc;
    this.#persistence.html = doc;
    if (!this.#socket || isSync) return;
    console.debug("Controller:outgoing");
    this.#socket.emit(
      "update:html",
      JSON.stringify(transaction.changes.toJSON())
    );
    this.#socket.emit("sync:html", JSON.stringify(doc));
  }

  outgoingCss(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this.#frame) return;
    this.#frame.css = doc;
    this.#persistence.css = doc;
    if (!this.#socket || isSync) return;
    console.debug("Controller:outgoing");
    this.#socket.emit(
      "update:css",
      JSON.stringify(transaction.changes.toJSON())
    );
    this.#socket.emit("sync:css", JSON.stringify(doc));
  }
}
