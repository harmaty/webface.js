import '../webface_init.js'
import { extend_as          } from '../lib/utils/mixin.js'
import { fetch_dom          } from '../test_utils.js'
import { Component          } from './lib/component.js'
import { ComponentBehaviors } from './lib/behaviors/component_behaviors.js'

class DummyBehaviors extends ComponentBehaviors {
  hello() { return "hello"; }
}

class DummyComponent extends extend_as("DummyComponent").mix(Component).with() {
  static get behaviors() { return [DummyBehaviors]; }
  constructor() {
    super();
    this.attribute_names = ["caption"];
  }
}

describe("Component", function() {

  var component, dom;

  beforeEach(async function() {
    dom = await fetch_dom("fixtures/component.html");
    DummyComponent.owner_document = dom;
    component = new DummyComponent();
    component.dom_element = dom.querySelector('[data-component-class="DummyComponent"]');
  });

  describe("behaviors", function() {

    it("instantiates behavior instances", function() {
      chai.expect(component.behavior_instances).to.have.lengthOf(1);
    });

    it("calls a method in each behavior instance associated with the component", function() {
      chai.expect(component.behave("hello")).to.equal("hello");
    });

    it("silently ignores the behavior if it doesn't exist and Component#ignore_misbehavior is set to false", function() {
      chai.expect(component.behave("hello1")).to.equal(undefined);
      component.ignore_misbehavior = false;
      chai.expect( () => component.behave("hello1")).to.throw();
    });
    
  });

  describe("I18n", function() {

    beforeEach(function() {
      var dummy_component_json_data = '{ "l1" : { "l2" : { "l3" : "ok", "with_placeholder": "placeholder is %x" }}}'
      var component_json_data = '{ "l4" : { "l5" : { "l6" : "ok" }}}'
      var body = `<body><div id='i18n_DummyComponent_data_holder' data-i18n-json='${dummy_component_json_data}\'></div>` +
                 `<div id='i18n_Component_data_holder' data-i18n-json='${component_json_data}\'></div></body>`
      var doc = new DOMParser().parseFromString(body, "text/xml");
      component._loadI18n(doc);
    });

    it("loads i18n translations for all components that descend from Component class and for itself", function() {
      chai.expect(window.webface.components_i18n["DummyComponent"].names).to.eql(["i18n_Component", "i18n_DummyComponent"]);
    });

    it("finds translations", function() {
      chai.expect(component.t("l1.l2.l3")).to.equal("ok");
      chai.expect(component.t("l4.l5.l6")).to.equal("ok");
      chai.expect(component.t("l1.l2.with_placeholder", { "x" : "HELLO" })).to.equal("placeholder is HELLO");
    });

    it("displays a console warning if translation isn't found and returns the original key as a translation", function() {
      chai.expect(component.t("l1.l2.l4")).to.equal("l4");
      chai.expect(window.webface.logmaster_print_spy).to.be.called.with("WARN: translation missing for \"l1.l2.l4\" in \"DummyComponent\" translator(s).");
    });
    
  });

  describe("attribute callbacks", function() {

    it("invokes the default callback and sets attribute value to the corresponding DOM element's text content", function() {
      component.set("caption", "new value");
      chai.expect(component.dom_element.querySelector('[data-component-property="caption"]').textContent).to.equal("new value");
    });
    
  });

  describe("removing a component", function() {
    
    var child;

    beforeEach(function() {
      child = new DummyComponent();
      component.addChild(child);
    });

    it("removes component from the parent's children list and its dom_element from the DOM", function() {
      chai.expect(component.children).to.include(child);
      child.remove();
      chai.expect(component.children).to.not.include(child);
    });

    it("calls remove() on each of its children too if 'deep' flag is passed", function() {
      var child2 = new DummyComponent();
      var child3 = new DummyComponent();
      child.addChild(child2);
      child.addChild(child3);
      chai.expect(child.children).to.include(child2);
      chai.expect(child.children).to.include(child3);
      child.remove({ deep: true });
      chai.expect(child.children).to.be.empty;
    });

    it("removes its DOM element from the document", function() {
      child.dom_element.setAttribute("id", "child_component");
      child.remove();
      chai.expect(component.dom_element.querySelector("#child_component")).to.be.null;
    });
    
  });

  describe("capturing events", function() {

    var spy, child;

    beforeEach(function() {
      spy = chai.spy();
      child = new DummyComponent();
      child.event_handlers.add({ event: "event1", handler: spy });
      component.addChild(child);
    });
    
    it("applies the handler for the event", function() {
      child.captureEvent("event1", ["#self"]);
      chai.expect(spy).to.be.called.once;
    });

    it("publishes the event to the parent", function() {
      child.roles.push("child_role_1");
      component.event_handlers.add({ event: "event1", role: "child_role_1", handler: spy });
      child.captureEvent("event1", ["#self"]);
      chai.expect(spy).to.be.called.twice;
    });

    it("prevents the native event", function() {
      var mouse_event = document.createEvent('MouseEvent');
      mouse_event.initMouseEvent("mousedown");
      var mouse_spy = chai.spy.on(mouse_event, "preventDefault");
      child.event_handlers.add({ event: "mousedown", handler: function() {} });
      child.captureEvent(mouse_event, ["#self"], { prevent_default: true, is_native: true });
      chai.expect(mouse_spy).to.have.been.called.once;
    });

    it("adds event lock and disallows further invokation of handles for the same event, including the native event handler", function() {
      var mouse_event = document.createEvent('MouseEvent');
      mouse_event.initMouseEvent("mousedown");
      var mouse_spy = chai.spy.on(mouse_event, "preventDefault");
      child.event_handlers.add({ event: "mousedown", handler: spy });
      child.event_lock_for.add("mousedown");
      child.captureEvent(mouse_event, ["#self"], { is_native: true });
      child.captureEvent(mouse_event, ["#self"], { is_native: true });
      chai.expect(spy).to.have.been.called.once;
      chai.expect(mouse_spy).to.have.been.called.once;
    });

  });
    
});
