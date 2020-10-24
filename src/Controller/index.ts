import { Persistence } from "../Persistence";
import { Frame } from "../Frame";
import { View } from "../View";
import { ChangeSet, Transaction } from "@codemirror/next/state";
import { KeyManager } from "../KeyManager";
import { Socket } from "../Socket";

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
  #view: View | null = null;

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
      this.useView();
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
      uri: `ws://localhost:${
        (import.meta as any).env.SNOWPACK_PUBLIC_WSS_PORT
      }`,
      room: this.#room,
      key: this.#keyManager.key as CryptoKey,
    });
  }

  registerSocketEvents() {
    if (!this.#socket) return;
    this.#socket.on("joined", (js: string[]) => {
      this.#persistence.js = js ? js.join("\n") : "";
      this.useFrame();
      this.useView();
    });
    this.#socket.on("update", (json: JSON) => {
      console.debug("Controller:incoming");
      if (!this.#view) return;
      const changes = ChangeSet.fromJSON(json as any);
      this.#view.incoming(changes);
    });
  }

  useFrame() {
    this.#frame = new Frame({
      js: this.#persistence.js,
      parent: document.querySelector("#frame") as Element,
    });
  }

  useView() {
    this.#view = new View({
      js: this.#persistence.js,
      outgoing: this.outgoing.bind(this),
      parent: document.querySelector("#view") as Element,
    });
  }

  outgoing(doc: string, transaction: Transaction, isSync: boolean = false) {
    if (!this.#frame) return;
    this.#frame.js = doc;
    this.#persistence.js = doc;
    if (!this.#socket || isSync) return;
    console.debug("Controller:outgoing");
    this.#socket.emit("update", JSON.stringify(transaction.changes.toJSON()));
    this.#socket.emit("sync", JSON.stringify(doc));
  }
}
