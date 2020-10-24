import { Persistence } from "./Persistence";
import { Controller } from "./Controller";

const persistence = new Persistence();
const controller = new Controller({ persistence });
const button = document.querySelector("#share") as Element;
button.addEventListener("click", async () => {
  await controller.share();
});
controller.start();
