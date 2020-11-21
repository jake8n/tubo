import io from "socket.io-client";
import { decrypt, encrypt } from "../cryptography";

export class Socket {
  private _uri: string;
  private _key?: CryptoKey;
  client: SocketIOClient.Socket | null = null;

  constructor(uri: string) {
    this._uri = uri;
  }

  set key(key: CryptoKey) {
    this._key = key;
  }

  open() {
    this.client = io(this._uri);
  }

  close() {
    this.client?.close();
  }

  unsecureEmit(event: string, content: string) {
    return this.client?.emit(event, content);
  }

  async emit(event: string, content: string) {
    if (!this._key) throw new Error("socket key not defined");
    console.debug(`socket::emit::${event}`, content);
    return this.client?.emit(event, await encrypt(this._key, content));
  }

  on(event: string, callback: Function, once: boolean = false) {
    if (!this._key) throw new Error("socket key not defined");
    const method = once ? "once" : "on";
    this.client?.[method](event, async (value: ArrayBuffer | undefined) => {
      console.debug(`socket::on::${event}`);
      if (value) {
        return callback(await decrypt(this._key as CryptoKey, value));
      } else {
        return callback();
      }
    });
  }

  once(event: string, callback: Function) {
    this.on(event, callback, true);
  }

  off(event: string, callback?: Function) {
    this.client?.off(event, callback);
  }
}
