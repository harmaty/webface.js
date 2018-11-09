import { Animator } from '../../lib/animator.js'

var obj = document.querySelector("#object");

["hide", "show", "scrollDown", "scrollUp"].forEach((method) => {
  var button = document.querySelectorAll(`#${method}`);
  button.addEventListener("click", () => {
    Animator[method](obj, 1500);
  });
});
