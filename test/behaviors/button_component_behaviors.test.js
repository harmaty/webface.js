import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { ButtonComponentBehaviors } from '../lib/behaviors/button_component_behaviors.js'

describe("ButtonComponentBehaviors", function() {

  var behaviors;

  beforeEach(async function() {
    var component = { "dom_element" : await fetch_dom("fixtures/button_component.html"), "click_event" : ["click", "touchend"] };
    behaviors = new ButtonComponentBehaviors(component);
  });

  it("#disable behavior adds 'disabled=disabled' attribute to the dom_element", function() {
    behaviors.disable();
    chai.expect(behaviors.dom_element.getAttribute("disabled")).to.equal("disabled");
  });

  it("#enable behavior removes 'disabled' attribute from the dom_element", function() {
    behaviors.disable();
    behaviors.enable();
    chai.expect(behaviors.dom_element.getAttribute("disabled")).to.be.null;
  });

  it("#unlock behaviors removes the event lock for the click event", function() {
    var spy = chai.spy.on(behaviors.component, "removeEventLock");
    behaviors.unlock();
    chai.expect(spy).to.have.been.called.with(["click", "touchend"]);
  });

});
