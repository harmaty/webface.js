import { Component } from './component.js'

export var Animator = {

  "show": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      if((el.offsetHeight > 0 && el.offsetParent == null) || (window.getComputedStyle(el).opacity == 1 && window.getComputedStyle(el).display == display_value))
        return;
      el.style.display = display_value;
      return el.animate([{ opacity: 0 }, { opacity : 1 }], ms);
    });
  },

  "hide": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {
      var animation = el.animate([{ opacity: 1 }, { opacity : 0 }], ms);
      animation.onfinish = function(i) { el.style.display = "none" };
      return animation;
    });
  },

  "scrollDown": function(elements, ms, { display_value="block" }={}) {
    return this._applyToCollection(elements, (el) => {
      if((el.offsetHeight > 0 && el.offsetParent == null) || (window.getComputedStyle(el).opacity == 1 && window.getComputedStyle(el).display == display_value))
        return;
      el.style.display = display_value;
      var original_height = el.getBoundingClientRect().height;
      return el.animate([{ opacity: 1, height: "0px" }, { height: `${original_height}px`, opacity: 1 }], ms);
    });
  },

  "scrollUp": function(elements, ms) {
    return this._applyToCollection(elements, (el) => {
      var original_height = el.getBoundingClientRect().height;
      var animation = el.animate([{ height: `${original_height}px` }, { height: "0px" }], ms);
      animation.onfinish = function(i) { el.style.display = "none" };
      return animation;
    });
  },

  "_applyToCollection": function(elements, func) {
    if(!(elements instanceof Array))
      elements = [elements];

    elements = elements.map((el) => {
      if(el instanceof Component)
        return el.dom_element;
      else
        return el;
    });

    var f;
    elements.forEach((el) => {
      f = func(el);
    });
    return f;
  }

}
