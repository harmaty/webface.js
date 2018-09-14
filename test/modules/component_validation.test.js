import { extend_as }           from '../lib/utils/mixin.js'
import { I18n }                from '../lib/i18n.js'
import { Attributable }        from '../lib/modules/attributable.js'
import { Heritable }           from '../lib/modules/heritable.js'
import { Validatable }         from '../lib/modules/validatable.js'
import { Publisher   }         from '../lib/modules/observable_roles/publisher.js'
import { ComponentValidation, NoChildForValidations } from '../lib/modules/component_validation.js'

class DummyComponent extends extend_as("ComponentDomClass").mixins(Validatable, Heritable, ComponentValidation, Publisher, Attributable) {

  constructor() {
    super();
    // init I18n. It's done in the Component class, but we don't use it here
    // for minimilist purposes and to isolate this test better.
    this.i18n = new I18n();
    var json_data = '{ "validations" : { "attr1" : "field 1 validation message" }}'
    var body = `<div id='i18n_data_holder' data-i18n-json='${json_data}\'></div>`
    var doc = new DOMParser().parseFromString(body, "text/xml");
    this.i18n.loadData(doc);

    this.attribute_names = ["attr1", "attr2"];

    this.validations = {
      "attr1"        : { "isMoreThan": { "value": 1, "i18n_message": "DummyComponent.attr1" }},
      "attr2"        : { "isMoreThan": 1 },
      "role2.attr2" :  { "isMoreThan": 1 },
      "role3.attr3" :  { "isMoreThan": 1 }
    }
  }

  t(key, component_name) { return this.i18n.t(key); }

}

class DummyChildComponent extends extend_as("DummyChildComponent").mixins(Validatable, Heritable, ComponentValidation, Publisher) {
  constructor() {
    super();
    this.validations = {};
  }
}

var component;

describe('ComponentValidation', function() {

  beforeEach(function() {
     component = new DummyComponent();
  });

  it("translates the validation message", function() {
    component._i18nize_validation_messages();
    chai.expect(component.validations["attr1"]["isMoreThan"]["message"]).to.equal("field 1 validation message");
  });

  it("separates descendant validations from the rest", function() {
    component._separateDescendantValidations();
    chai.expect(Object.keys(component.validations)).to.include("attr1");
    chai.expect(Object.keys(component.validations)).to.not.include("role2.attr2");
  });

  it("runs validations on itself", function() {
    component.set("attr1", 2);
    component.set("attr2", 2);
    component.validate();
  });

  it("shows validation errors if they're found (with behave() method)", function() {
    
  });

  describe("with children", function() {

    var child2;
    var child3;

    beforeEach(function() {
      child2 = new DummyChildComponent();
      child3 = new DummyChildComponent();
      child2.roles.push("role2");
      child3.roles.push("role3");
      component.children.push(child2);
      component._separateDescendantValidations()
    });

    it("adds validations to the child component if the role fits", function() {

      component._addValidationsToChild(child2);
      chai.expect(Object.keys(child2.validations)).to.include("attr2");

      chai.expect(function() { component._addValidationsToChild(child3); }).to.throw(NoChildForValidations);
      chai.expect(Object.keys(child3.validations)).to.not.include("role3.attr3");
    });

    it("runs validations on its children", function() {

    });
    
  });

});
