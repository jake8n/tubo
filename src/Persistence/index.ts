export interface File {
  path: string;
  doc: string;
  lang: "html" | "javascript" | "css";
}

const initialFiles: File[] = [
  {
    path: "index.html",
    doc: `<!-- index.html -->

<p>Tubo is an in-browser code editor with E2E encrypted shared sessions 🙈</p>

<p>Our unique rendering engine can import and export ES Modules. Check out the console log to see it in action!</p>
`,
    lang: "html",
  },
  {
    path: "entry.js",
    doc: `// entry.js

import { message } from "./helpers.js"

console.log(message)
`,
    lang: "javascript",
  },
  {
    path: "helpers.js",
    doc: `// helpers.js

export const message = "Hello from helpers.js!"
`,
    lang: "javascript",
  },
  {
    path: "main.css",
    doc: `/* main.css */

body {
  font-family: sans-serif;
  font-size: 2rem;
  padding: 1rem;
}
`,
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
