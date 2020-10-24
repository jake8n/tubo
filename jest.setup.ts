global.crypto = {
  // @ts-ignore
  subtle: {
    decrypt: jest.fn().mockResolvedValue("decrypted"),
    encrypt: jest.fn().mockResolvedValue("#encrypted#"),
  },
};
class TextDecoderMock {
  decode() {
    return '["decoded"]';
  }
}
class TextEncoderMock {
  encode() {}
}
// @ts-ignore
global.TextDecoder = TextDecoderMock;
// @ts-ignore
global.TextEncoder = TextEncoderMock;
