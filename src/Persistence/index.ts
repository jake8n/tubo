export interface File {
  path: string;
  doc: string;
  lang: "html" | "javascript" | "css";
}

const initialFiles: File[] = [
  {
    path: "index.html",
    doc: "<!-- index.html -->\n",
    lang: "html",
  },
  {
    path: "entry.js",
    doc: "// entry.js\n",
    lang: "javascript",
  },
  {
    path: "main.css",
    doc: "/* main.css */\n",
    lang: "css",
  },
];
const initialActiveTab = "index.html";

export class Persistence {
  get files(): File[] {
    const local = localStorage.getItem("files");
    return local ? JSON.parse(local) : initialFiles;
  }

  set files(files: File[]) {
    localStorage.setItem("files", JSON.stringify(files));
  }

  get activeTab(): string {
    const local = localStorage.getItem("activeTab");
    return local ? local : initialActiveTab;
  }

  set activeTab(activeTab: string) {
    localStorage.setItem("activeTab", activeTab);
  }
}
