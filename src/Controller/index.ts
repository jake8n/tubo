import { Persistence } from "../Persistence";
import { Frame } from "../Frame";
import { View } from "../View";
import { ChangeSet, Transaction } from "@codemirror/next/state";
import { KeyManager } from "../KeyManager";
import { Socket } from "../Socket";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { nanoid } from "nanoid";

export interface ControllerConfig {
  persistence: Persistence;
}

export class Controller {
  private _frame: Frame | null = null;
  private _keyManager: KeyManager;
  private _objectKey: string;
  private _persistence: Persistence;
  private _room: string;
  private _socket: Socket | null = null;
  viewJs: View | null = null;
  viewHtml: View | null = null;
  viewCss: View | null = null;

  constructor(config: ControllerConfig) {
    this._keyManager = new KeyManager();
    this._persistence = config.persistence;
    this._room = this.getRoomFromWindow();
    this._objectKey = this.getObjectKeyFromWindow();
  }

  getRoomFromWindow() {
    return new URLSearchParams(window.location.search).get("room") || "";
  }

  getObjectKeyFromWindow() {
    return window.location.hash.slice("#key=".length);
  }

  async start() {
    if (this._room.length && this._objectKey.length) {
      await this._keyManager.import(this._objectKey);
      this.setSocket();
      (this._socket as Socket).open();
      this.registerSocketEvents();
    } else {
      this.useFrame();
      this.useViews();
    }
  }

  async share() {
    // set key on window
    await this._keyManager.generate();
    window.location.hash = "#key=" + (await this._keyManager.export());
    // set up socket
    this.setSocket();
    (this._socket as Socket).open();
    this.registerSocketEvents();
    (this._socket as Socket).emit("sync", JSON.stringify(this._persistence.js));
    // TODO: avoid page refresh (and send current local storage to server)
    // set room on window
    const room = nanoid();
    const searchParams = new URLSearchParams();
    searchParams.set("room", room);
    window.location.search = searchParams.toString();
  }

  setSocket() {
    this._socket = new Socket({
      uri: (import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI,
      room: this._room,
      key: this._keyManager.key as CryptoKey,
    });
  }

  registerSocketEvents() {
    console.debug("Controller:registerSocketEvents");
    this.useFrame();
    this.useViews();
    ["Js", "Html", "Css"].forEach((value) => {
      if (!this._socket) return;
      this._socket.on(`init:${value.toLowerCase()}`, (doc: string[]) => {
        console.debug("Controller:init");
        // @ts-ignore
        this._persistence[value.toLowerCase()] = doc ? doc.join("\n") : "";
      });
      this._socket.on(`update:${value.toLowerCase()}`, (json: JSON) => {
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
    this._frame = new Frame({
      js: this._persistence.js,
      html: this._persistence.html,
      css: this._persistence.css,
      parent: document.querySelector("#frame") as Element,
    });
  }

  useViews() {
    this.viewJs = new View({
      extensions: [javascript()],
      initialState: this._persistence.js,
      outgoing: this.outgoingJs.bind(this),
      parent: document.querySelector("#view-js") as Element,
    });
    this.viewHtml = new View({
      extensions: [html()],
      initialState: this._persistence.html,
      outgoing: this.outgoingHtml.bind(this),
      parent: document.querySelector("#view-html") as Element,
    });
    this.viewCss = new View({
      extensions: [css()],
      initialState: this._persistence.css,
      outgoing: this.outgoingCss.bind(this),
      parent: document.querySelector("#view-css") as Element,
    });
  }

  outgoingJs(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this._frame) return;
    this._frame.js = doc;
    this._persistence.js = doc;
    if (!this._socket || isSync) return;
    console.debug("Controller:outgoing");
    this._socket.emit(
      "update:js",
      JSON.stringify(transaction.changes.toJSON())
    );
    this._socket.emit("sync:js", JSON.stringify(doc));
  }

  outgoingHtml(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this._frame) return;
    this._frame.html = doc;
    this._persistence.html = doc;
    if (!this._socket || isSync) return;
    console.debug("Controller:outgoing");
    this._socket.emit(
      "update:html",
      JSON.stringify(transaction.changes.toJSON())
    );
    this._socket.emit("sync:html", JSON.stringify(doc));
  }

  outgoingCss(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this._frame) return;
    this._frame.css = doc;
    this._persistence.css = doc;
    if (!this._socket || isSync) return;
    console.debug("Controller:outgoing");
    this._socket.emit(
      "update:css",
      JSON.stringify(transaction.changes.toJSON())
    );
    this._socket.emit("sync:css", JSON.stringify(doc));
  }
}
