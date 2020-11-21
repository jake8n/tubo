import React, { h } from "preact";
import { nanoid } from "nanoid";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { KeyManager } from "../../KeyManager";
import { Socket } from "../../Socket";
import Frame from "../Frame";
import View from "../View";
import { Extension as CodeMirrorExtension } from "@codemirror/next/state";
import { useState } from "preact/hooks";

type Extension = "js" | "html" | "css";
interface ViewConfig {
  extension: Extension;
  extensions: CodeMirrorExtension[];
}

const views: ViewConfig[] = [
  {
    extension: "js",
    extensions: [javascript()],
  },
  {
    extension: "html",
    extensions: [html()],
  },
  {
    extension: "css",
    extensions: [css()],
  },
];

export default function () {
  const keyManager = new KeyManager();
  const socket = new Socket(
    (import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI
  );
  const [files, setFiles] = useState({ js: "", html: "", css: "" });
  const [isUsingSocket, setIsUsingSocket] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [initialRoom, initialObjectKey] = window.location.hash
    .slice(1)
    .split(",");
  const [room, setRoom] = useState(initialRoom);
  const [objectKey, setObjectKey] = useState(initialObjectKey);

  const initialiseSocket = async () => {
    await keyManager.import(objectKey);
    socket.key = keyManager.key as CryptoKey;
    socket.open();
    socket.once("room-created", () => setIsSocketReady(true));
    socket.once("room-joined", (filesAsString: string) => {
      setFiles(JSON.parse(filesAsString));
      setIsSocketReady(true);
    });
    socket.on("request-for-state", () =>
      socket.emit("response-for-state", JSON.stringify(files))
    );
    socket.unsecureEmit("join-room", room);
  };

  const onShare = async () => {
    setIsUsingSocket(true);
    setRoom(nanoid());
    await keyManager.generate();
    setObjectKey(await keyManager.export());
    console.log({ room, objectKey });
    history.replaceState(null, "", `#${room},${objectKey}`);
    await initialiseSocket();
  };

  if (room.length && objectKey.length) {
    setIsUsingSocket(true);
    initialiseSocket();
  }

  const onOutgoingGenerator = (extension: Extension) => (doc: string) =>
    setFiles({ ...files, [extension]: doc });

  if (isUsingSocket === isSocketReady) {
    return (
      <div>
        {!socket.client && <button onClick={onShare}>Share</button>}
        <div class="flex">
          {views.map(({ extension, extensions }) => (
            <View
              extension={extension}
              extensions={extensions}
              initialLocalState={files[extension]}
              onOutgoing={onOutgoingGenerator(extension)}
              socket={socket}
            />
          ))}
        </div>
        <Frame {...files} />
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}
