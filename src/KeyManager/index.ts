export class KeyManager {
  private _algorithm: AesKeyGenParams = { name: "AES-GCM", length: 128 };
  private _keyUsages: KeyUsage[] = ["encrypt", "decrypt"];
  key?: CryptoKey;

  async generate(): Promise<void> {
    this.key = (await window.crypto.subtle.generateKey(
      this._algorithm,
      true,
      this._keyUsages
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
        key_ops: this._keyUsages,
        kty: "oct",
      },
      this._algorithm,
      false,
      this._keyUsages
    );
  }
}
