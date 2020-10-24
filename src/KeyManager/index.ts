export class KeyManager {
  #algorithm: AesKeyGenParams = { name: "AES-GCM", length: 128 };
  #keyUsages: KeyUsage[] = ["encrypt", "decrypt"];
  key?: CryptoKey;

  async generate(): Promise<void> {
    this.key = (await window.crypto.subtle.generateKey(
      this.#algorithm,
      true,
      this.#keyUsages
    )) as CryptoKey;
  }

  async export(): Promise<string> {
    if (this.key) {
      const { k } = await window.crypto.subtle.exportKey("jwk", this.key);
      return k as string;
    } else {
      throw new Error("key is undefined");
    }
  }

  async import(k: string): Promise<void> {
    this.key = await window.crypto.subtle.importKey(
      "jwk",
      {
        k,
        alg: "A128GCM",
        ext: false,
        key_ops: this.#keyUsages,
        kty: "oct",
      },
      this.#algorithm,
      false,
      this.#keyUsages
    );
  }
}
