import React, { h } from "preact";
import { nanoid } from "nanoid";
import { javascript } from "@codemirror/next/lang-javascript";
import { html } from "@codemirror/next/lang-html";
import { css } from "@codemirror/next/lang-css";
import { KeyManager } from "../KeyManager";
import { Socket } from "../Socket";
import Frame from "../Frame";
import View from "../View";
import { Extension as CodeMirrorExtension } from "@codemirror/next/state";
import { useState, useEffect } from "preact/hooks";
import { Persistence } from "../Persistence";
import { TabContent, Tabs } from "../Tab";
import NavButton from "../NavButton";
import { IconRadio } from "../Icons";

const persistence = new Persistence();
type Extension = "js" | "html" | "css";
const views: {
  extension: Extension;
  extensions: CodeMirrorExtension[];
}[] = [
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
  const [keyManager] = useState(new KeyManager());
  const [socket] = useState(
    new Socket((import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI)
  );
  const [files, setFiles] = useState({
    js: persistence.js,
    html: persistence.html,
    css: persistence.css,
  });
  const [isUsingSocket, setIsUsingSocket] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [roomKeyPair, setRoomKeyPair] = useState(getRoomKeyPairFromURL());
  const [activeTab, setActiveTab] = useState("js");

  const initialiseSocket = async () => {
    setIsUsingSocket(true);
    const [room, key] = roomKeyPair;
    await keyManager.import(key);
    socket.key = keyManager.key as CryptoKey;
    socket.open();
    socket.once("room-created", () => setIsSocketReady(true));
    socket.once("room-joined", (state: string) => {
      const { activeTab, files } = JSON.parse(state);
      setActiveTab(activeTab);
      setFiles(files);
      setIsSocketReady(true);
    });
    socket.on("set-active-tab", (id: string) => setActiveTab(id));
    socket.unsecureEmit("join-room", room);
  };

  const onShare = async () => {
    await keyManager.generate();
    setRoomKeyPair([nanoid(), await keyManager.export()]);
  };

  useEffect(() => {
    const [room, key] = roomKeyPair;
    // when first initialised there may not be a room key pair in URL
    if (!room.length) return;

    initialiseSocket().then(() => {
      const [urlRoom, urlKey] = getRoomKeyPairFromURL();
      if (room === urlRoom && key === urlKey) return;

      history.replaceState(null, "", `#${room},${key}`);

      // if (window.confirm('Share this unique URL and enjoy e2e encyrpted coding. Clicking OK copies it to your clipboard.')) {
      // TODO: copy to clipboard
      // }
    });
  }, [roomKeyPair]);

  // re register to ensure files has latest state
  useEffect(() => {
    if (!isSocketReady) return;

    const responseForState = () =>
      socket.emit(
        "response-for-state",
        JSON.stringify({
          activeTab,
          files,
        })
      );
    socket.on("request-for-state", responseForState);

    return () => socket.off("request-for-state");
  }, [isSocketReady, files]);

  const onOutgoingGenerator = (extension: Extension) => (doc: string) => {
    persistence[extension] = doc;
    setFiles({ ...files, [extension]: doc });
  };

  const onChangeTab = (id: string) => {
    setActiveTab(id);
    socket?.emit("set-active-tab", id);
  };

  if (isUsingSocket === isSocketReady) {
    return (
      <div class="h-screen flex">
        <aside class="bg-blue-500 flex flex-col items-center p-2">
          {isUsingSocket ? (
            <NavButton text="Sharing" active>
              <IconRadio />
            </NavButton>
          ) : (
            <NavButton text="Share" onClick={onShare}>
              <IconRadio />
            </NavButton>
          )}
        </aside>

        <main class="flex flex-col lg:flex-row flex-1">
          <div class="bg-gray-200 flex flex-col flex-1 overflow-y-auto">
            <Tabs
              names={["script.js", "index.html", "main.css"]}
              ids={views.map((view) => view.extension)}
              active={activeTab}
              onChange={onChangeTab}
            />
            {views.map(({ extension, extensions }) => (
              <TabContent active={extension === activeTab}>
                <View
                  extension={extension}
                  extensions={extensions}
                  initialLocalState={files[extension]}
                  onOutgoing={onOutgoingGenerator(extension)}
                  socket={socket}
                />
              </TabContent>
            ))}
          </div>

          <div class="flex-1">
            <Frame {...files} />
          </div>
        </main>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}

const getRoomKeyPairFromURL = () => window.location.hash.slice(1).split(",");
