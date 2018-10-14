import '../webface_init.js'
import { Component          } from './lib/component.js'
import { ComponentBehaviors } from './lib/behaviors/component_behaviors.js'

class DummyBehaviors extends ComponentBehaviors {
  hello() { return "hello"; }
}

class DummyComponent extends Component {
  static get behaviors() { return [DummyBehaviors]; }
}

describe("Component", function() {

  var component;

  beforeEach(function() {
    component = new DummyComponent();
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
    
});
