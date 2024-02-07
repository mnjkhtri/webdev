function welcome() {
    alert("Welcome welcome");
}

let button = document.querySelector("#welcome");
button.addEventListener("click", welcome);

const story = document.body.querySelector(".story");
const setText = document.body.querySelector("#set-text");
setText.addEventListener("click", () => {
  story.textContent = "It was a dark and stormy night...";
});

const clearText = document.body.querySelector("#remove-text");
clearText.addEventListener("click", () => {
  story.textContent = "";
});

const parentContainer = document.querySelector("#parent");
const makeChildren = document.querySelector("#make-child");
makeChildren.addEventListener("click", () => {
  if (parentContainer.childNodes.length > 1) {
    return;
  }
  const child = document.createElement("div");
  child.classList.add("child");
  child.textContent = "child";
  parentContainer.appendChild(child);
});

const destroyChild = document.querySelector("#destroy-child");
destroyChild.addEventListener("click", () => {
  const child = document.body.querySelector(".child");
  parentContainer.removeChild(child);
});