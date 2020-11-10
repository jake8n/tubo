import io from "socket.io-client";
import { decrypt, encrypt } from "../cryptography";

interface SocketConfig {
  uri: string;
  room: string;
  key: CryptoKey;
}

export class Socket {
  private _uri: string;
  private _room: string;
  private _key: CryptoKey;
  client: SocketIOClient.Socket | null = null;

  constructor(config: SocketConfig) {
    this._uri = config.uri;
    this._room = config.room;
    this._key = config.key;
  }

  open() {
    // @ts-ignore
    this.client = io(this._uri, { query: { room: this._room } });
  }

  isClientNull() {
    if (!this.client) throw new Error("client is null");
  }

  close() {
    this.isClientNull();
    this.client?.close();
  }

  async emit(event: string, content: string) {
    this.isClientNull();
    const encrypted = await encrypt(this._key, content);
    this.client?.emit(event, encrypted);
  }

  on(event: string, callback: Function) {
    this.isClientNull();
    this.client?.on(event, async (content: ArrayBuffer) => {
      if (content) {
        const decrypted = await decrypt(this._key, content);
        return callback(JSON.parse(decrypted));
      } else {
        return callback();
      }
    });
  }
}
