import "./index.css";
import React, { h, render } from "preact";
import Tubo from "./components/Tubo";

(async () => {
  try {
    // @ts-ignore
    if (import.meta.env.MODE === "development") {
      // @ts-ignore
      await import("preact/debug");
    }
  } catch (err) {
    console.error(err);
  } finally {
    render(<Tubo />, document.querySelector("#app") as HTMLElement);
  }
})();
