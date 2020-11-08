// import { Persistence } from "./Persistence";
// import { Controller } from "./Controller";

// const persistence = new Persistence();
// const controller = new Controller({ persistence });
// const button = document.querySelector("#share") as Element;
// button.addEventListener("click", async () => {
//   await controller.share();
// });
// controller.start();

import "./index.css";
import { h, render } from "preact";
import App from "./components/App";

render(<App />, document.querySelector("#app") as HTMLElement);
