const events = new Map<string, Function>();

export const close = jest.fn();
export const emit = jest.fn();
export const on = (event: string, callback: Function) => {
  events.set(event, callback);
};
export const trigger = (event: string, content: ArrayBuffer) => {
  const callback = events.get(event);
  if (callback) {
    callback(content);
  }
};

export default () => ({
  close,
  emit,
  on,
});
