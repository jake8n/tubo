import React, { h } from "preact";
import { nanoid } from "nanoid";
import { KeyManager } from "../KeyManager";
import { Socket } from "../Socket";
import Frame from "../Frame";
import View from "../View";
import { useState, useEffect } from "preact/hooks";
import { Persistence } from "../Persistence";
import { TabContent, Tabs } from "../Tab";
import NavButton from "../NavButton";
import { IconArchive, IconRadio } from "../Icons";

const persistence = new Persistence();

export default function Tubo() {
  const [keyManager] = useState(new KeyManager());
  const [socket] = useState(
    new Socket((import.meta as any).env.SNOWPACK_PUBLIC_SOCKET_URI)
  );
  const [files, setFiles] = useState(persistence.files);
  const [isUsingSocket, setIsUsingSocket] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [roomKeyPair, setRoomKeyPair] = useState(getRoomKeyPairFromURL());
  const [activeTab, setActiveTab] = useState(persistence.activeTab);

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
    socket.on("set-active-tab", (id: string) => {
      persistence.activeTab = id;
      setActiveTab(id);
    });
    socket.on("new-file", (path: string) => createNewFile(path));
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

      alert("Your URL has been updated! Share it to start collaborating.");
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

  const onOutgoingGenerator = (path: string) => (doc: string) => {
    const nextFiles = files.map((file) => {
      if (file.path === path) {
        return {
          ...file,
          doc,
        };
      } else {
        return file;
      }
    });
    persistence.files = nextFiles;
    setFiles(nextFiles);
  };

  const onChangeTab = (id: string) => {
    persistence.activeTab = id;
    setActiveTab(id);
    if (socket.client) socket.emit("set-active-tab", id);
  };

  const onNewTab = () => {
    const path = prompt("Please enter a file name", "helpers.js");
    if (!path) return;
    if (!path.match(/[A-Za-z0-9-_]+\.js/g))
      return alert(
        'Files must have a ".js" extension and can include only "-" or "_" as special characters.'
      );
    if (files.find((file) => file.path === path))
      return alert("File already exists 😢");
    createNewFile(path);
    if (socket.client) socket.emit("new-file", path);
  };

  const createNewFile = (path: string) => {
    const nextFiles = files.concat({
      path: path,
      doc: `// ${path}\n`,
      lang: "javascript",
    });
    persistence.files = nextFiles;
    setFiles(nextFiles);
    persistence.activeTab = path;
    setActiveTab(path);
  };

  if (isUsingSocket === isSocketReady) {
    return (
      <div class="h-screen flex">
        <aside class="bg-blue-600 flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 68 68"
            class="text-pink-400 m-4"
            width="48"
            height="48"
          >
            <path
              d="M466,201 C466,214.807119 454.807119,226 441,226 C438.852652,226 436.768537,225.729267 434.779927,225.220073 C434.270733,223.231463 434,221.147348 434,219 C434,205.192881 445.192881,194 459,194 C461.147348,194 463.231463,194.270733 465.220073,194.779927 C465.729267,196.768537 466,198.852652 466,201 Z M459,190 C442.983742,190 430,202.983742 430,219 C430,220.576939 430.125866,222.124481 430.368099,223.633126 C421.87747,219.637714 416,211.005235 416,201 C416,187.192881 427.192881,176 441,176 C451.005235,176 459.637714,181.87747 463.633126,190.368099 C462.124481,190.125866 460.576939,190 459,190 Z M484,219 C484,232.807119 472.807119,244 459,244 C448.994765,244 440.362286,238.12253 436.366874,229.631901 C437.875519,229.874134 439.423061,230 441,230 C457.016258,230 470,217.016258 470,201 C470,199.423061 469.874134,197.875519 469.631901,196.366874 C478.12253,200.362286 484,208.994765 484,219 Z"
              transform="translate(-416 -176)"
            />
          </svg>
          {isUsingSocket ? (
            <NavButton text="Sharing" active>
              <IconRadio />
            </NavButton>
          ) : (
            <NavButton text="Share" onClick={onShare}>
              <IconRadio />
            </NavButton>
          )}
          {/* <NavButton text="Download">
            <IconArchive />
          </NavButton> */}
        </aside>

        <main class="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div class="bg-gray-200 flex flex-col flex-1 overflow-y-auto">
            <Tabs
              paths={files.map((file) => file.path)}
              active={activeTab}
              onChange={onChangeTab}
              onNew={onNewTab}
            />
            {files.map((file) => (
              <TabContent active={file.path === activeTab}>
                <View
                  {...file}
                  onOutgoing={onOutgoingGenerator(file.path)}
                  socket={socket}
                />
              </TabContent>
            ))}
          </div>

          <div class="flex-1">
            <Frame files={files} />
          </div>
        </main>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}

const getRoomKeyPairFromURL = () => window.location.hash.slice(1).split(",");
