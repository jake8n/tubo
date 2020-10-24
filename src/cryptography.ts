export const encrypt = (key: CryptoKey, content: string) =>
  window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    key,
    new TextEncoder().encode(content)
  );

const decode = (input: ArrayBuffer) =>
  new TextDecoder().decode(new Uint8Array(input));

export const decrypt = async (key: CryptoKey, content: ArrayBuffer) => {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    key,
    content
  );
  return decode(decrypted);
};
