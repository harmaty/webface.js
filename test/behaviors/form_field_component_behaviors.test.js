import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { FormFieldComponentBehaviors } from '../lib/behaviors/form_field_component_behaviors.js'

describe("FormFieldComponentBehaviors", function() {

  var behaviors, dom, errors_el, value_holder;

  beforeEach(async function() {

    dom          = (await fetch_dom("fixtures/form_field_component.html")).querySelector("div");
    errors_el    = dom.querySelector('#errors');
    value_holder = dom.querySelector('#value_holder');

    var component = {
      "dom_element":                      dom,
      "firstDomDescendantOrSelfWithAttr": function() { return errors_el },
      "value_holder_element":             value_holder,
      "children":                         [],
    };
    behaviors = new FormFieldComponentBehaviors(component);

  });

  it("shows errors on #showErrors behavior", function() {
    chai.expect(errors_el.style.display).to.equal("none");
    behaviors.showErrors();
    chai.expect(errors_el.style.display).to.equal("block");
  });

  it("calls showErrors() behavior on children if they have it", function() {
    var spy   = chai.spy();
    var child = { "behave" : spy };
    behaviors.component.children = [child];

    behaviors.showErrors();
    chai.expect(spy).to.have.been.called.with("showErrors");
  });

  it("hides errors on #hideErrors behavior", function() {
    behaviors.showErrors();
    chai.expect(errors_el.style.display).to.equal("block");
    behaviors.hideErrors();
    chai.expect(errors_el.style.display).to.equal("none");
  });

  it("calls hideErrors() behavior on children if they have it", function() {
    var spy   = chai.spy();
    var child = { "behave" : spy };
    behaviors.component.children = [child];

    behaviors.hideErrors();
    chai.expect(spy).to.have.been.called.with("hideErrors");
  });

  it("enables the value_holder field on #enable behavior", function() {
    behaviors.disable();
    behaviors.enable();
    chai.expect(value_holder.getAttribute("disabled")).to.equal(null);
    chai.expect(behaviors.component.disabled).to.equal(false);
  });

  it("disables the value_holder field on #disable behavior", function() {
    behaviors.disable();
    chai.expect(value_holder.getAttribute("disabled")).to.equal("disabled");
    chai.expect(behaviors.component.disabled).to.equal(true);
  });

});
