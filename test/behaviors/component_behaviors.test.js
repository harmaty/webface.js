import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { Component     } from '../lib/component.js'
import { ComponentBehaviors } from '../lib/behaviors/component_behaviors.js'

class DummyComponent {
  constructor() {
    this.dom_element = new DOMParser().parseFromString('<div data-component-class="DummyComponent" id="dummy"></div>', "text/html").documentElement.querySelector("body>div");
  }
  findPart(name) { return this.dom_element.querySelector(name); }
}

describe("ComponentBehaviors", function() {

  var component, behaviors, dom_element;

  beforeEach(function() {
    component = new DummyComponent();
    behaviors = new ComponentBehaviors(component);
    behaviors.show_hide_animation_speed = 1;
    dom_element = component.dom_element;
    document.querySelector("body").append(dom_element);
  });

  afterEach(function() {
    dom_element.remove();
  });

  it("hides component's dom_element", async function() {
    await behaviors.hide();
    chai.expect(dom_element.style.display).to.equal("none");
  });

  it("shows component's dom_element", async function() {
    await behaviors.hide();
    chai.expect(dom_element.style.display).to.equal("none");
    await behaviors.show();
    chai.expect(dom_element.style.display).to.equal("block")
  });

});
