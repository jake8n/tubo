import io from "socket.io-client";
import { decrypt, encrypt } from "../cryptography";

interface SocketConfig {
  uri: string;
  room: string;
  key: CryptoKey;
}

export class Socket {
  #uri: string;
  #room: string;
  #key: CryptoKey;
  client: SocketIOClient.Socket | null = null;

  constructor(config: SocketConfig) {
    this.#uri = config.uri;
    this.#room = config.room;
    this.#key = config.key;
  }

  open() {
    // @ts-ignore
    this.client = io(this.#uri, { query: { room: this.#room } });
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
    const encrypted = await encrypt(this.#key, content);
    this.client?.emit(event, encrypted);
  }

  on(event: string, callback: Function) {
    this.isClientNull();
    this.client?.on(event, async (content: ArrayBuffer) => {
      if (content) {
        const decrypted = await decrypt(this.#key, content);
        return callback(JSON.parse(decrypted));
      } else {
        return callback();
      }
    });
  }
}
