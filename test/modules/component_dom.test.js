import mixin from '../lib/utils/mixin.js'
import { fetch_dom    } from '../test_utils.js'
import { Attributable } from '../lib/modules/attributable.js'
import { ComponentDom } from '../lib/modules/component_dom.js'

class ComponentDomClass extends mixin(ComponentDom,Attributable) {
  constructor() {
    super();
    this.attribute_names = ["property1", "property2", "property3", "writeable_property1", "writeable_property2", "writeable_property3"];
  }
}

var dom;
var component_dom;
var spy;

describe('ComponentDom', function() {

  before(async function() {
    dom           = (await fetch_dom("fixtures/component_dom.html")).querySelector('[data-component-class="RootComponent"]');
    component_dom = new ComponentDomClass();
    component_dom.dom_element = dom;
  });

  it("finds all dom descendants and self by attr_name and attr_value", function() {
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value1"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value2"})).have.lengthOf(2)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value"})).have.lengthOf(1)
    chai.expect(component_dom.allDomDescendantsAndSelfWithAttr(dom, { attr_name: "attr", attr_value: "non_existent_value"})).be.empty
  });

  it("finds first descendant or self by attr_name and attr_value", function() {
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value1"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value2"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value"})).be.instanceof(Element)
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "non_existent_value"})).be.null
  });

  it("finds all parts of a component", function() {
    chai.expect(component_dom.findAllParts("part1")).to.have.lengthOf(1);
    chai.expect(component_dom.findAllParts("part2")).to.have.lengthOf(2);
    chai.expect(component_dom.findAllParts("part3")).to.have.lengthOf(1);
    chai.expect(component_dom.findAllParts("non_existent_part")).be.empty
  });

  it("finds the first part of a component it stumbles upon that matches the name", function() {
    chai.expect(component_dom.findPart("part1")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("part2")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("part3")).to.be.instanceof(Element);
    chai.expect(component_dom.findPart("non_existent_part")).be.null;
  });

  it("finds all descendants that are not components or descendants of a component included into the current node", function() {
    chai.expect(component_dom.allDomDescendants(dom).some((el) => el.getAttribute('data-component-class') != null)).to.be.false
  });

  it("finds ancestor elements with matching attributes", function() {
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom)).to.equal(dom);
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);
    chai.expect(component_dom.ancestorOrSelfWithAttr(dom.children[0], { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);

    var el = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "value3"});
    chai.expect(component_dom.ancestorOrSelfWithAttr(el, { attr_name: "attr", attr_value: "root_value" })).to.equal(dom);
  });

  it("finds all property elements for the component that match the name", function() {
    chai.expect(component_dom.findPropertyElements("property1")).to.have.lengthOf(2);
    chai.expect(component_dom.findPropertyElements("property2")).to.have.lengthOf(2);
    chai.expect(component_dom.findPropertyElements("non_existent_property")).be.empty;
  });

  it("finds first property element that matches the name", function() {
    chai.expect(component_dom.findFirstPropertyElement("property1")).to.be.instanceof(Element)
    chai.expect(component_dom.findFirstPropertyElement("property2")).to.be.instanceof(Element)
    chai.expect(component_dom.findFirstPropertyElement("non_existent_property")).be.null;
  });

  it("gets html attribute name for a property from data-component-attribute-names format", function() {
    chai.expect(component_dom._getHtmlAttributeNameForProperty("property1:data-property1,property2:data-property2", "property1")).to.equal("data-property1")
    chai.expect(component_dom._getHtmlAttributeNameForProperty("property1:data-property1,property2:data-property2", "property2")).to.equal("data-property2")
    chai.expect(component_dom._getHtmlAttributeNameForProperty("property1:data-property1,property2:data-property2", "property3")).to.be.null;
  });

  it("converts string values into appropriate types", function() {
    chai.expect(component_dom._convertStringValueToType("true")).to.be.true
    chai.expect(component_dom._convertStringValueToType("false")).to.be.false
    chai.expect(component_dom._convertStringValueToType("1")).to.eq(1)
    chai.expect(component_dom._convertStringValueToType("1.23")).to.eq(1.23)
  });

  it("assigns attributes values from the string passed, converting them into appropriate types", function() {
    component_dom._assignPropertyFromNodeStringValue("property1", "true")
    chai.expect(component_dom.get("property1")).to.be.true
    component_dom._assignPropertyFromNodeStringValue("property1", "false")
    chai.expect(component_dom.get("property1")).to.be.false
    component_dom._assignPropertyFromNodeStringValue("property1", "1")
    chai.expect(component_dom.get("property1")).to.equal(1)
    component_dom._assignPropertyFromNodeStringValue("property1", "1.23")
    chai.expect(component_dom.get("property1")).to.equal(1.23)
  });

  it("reads property values from nodes and updates the corresponding attributes in the component", function() {
    component_dom._readPropertyFromNode("property1");
    component_dom._readPropertyFromNode("property2");
    component_dom._readPropertyFromNode("property3");
    chai.expect(component_dom.get("property1")).to.equal("value for property 1 - a");
    chai.expect(component_dom.get("property2")).to.equal(1);
    chai.expect(component_dom.get("property3")).to.equal(1.23);
  });

  it("writes attribute value to the corresponding property element textContent in the DOM", function() {
    
    var property_el      = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-property", attr_value: "writeable_property1" });
    var attr_property_el = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-writeable-property2", attr_value: "null" });

    component_dom.set("writeable_property1", "hello world");
    component_dom._writePropertyToNode("writeable_property1");
    chai.expect(property_el.textContent).to.equal("hello world");

    component_dom.set("writeable_property1", 1);
    component_dom._writePropertyToNode("writeable_property1");
    chai.expect(property_el.textContent).to.equal("1");

    component_dom.set("writeable_property1", 1.23);
    component_dom._writePropertyToNode("writeable_property1");
    chai.expect(property_el.textContent).to.equal("1.23");

    component_dom.set("writeable_property2", "hello world 2");
    component_dom._writePropertyToNode("writeable_property2");
    chai.expect(attr_property_el.getAttribute("data-writeable-property2")).to.equal("hello world 2");
  });

  it("finds whether the dom_element's descendants have a particular node or if it itself is this node", function() {
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-property", attr_value: "writeable_property1" }))).to.be.true
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-property", attr_value: "non_existent_property" }))).to.be.false
    chai.expect(component_dom._hasNode(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "attr", attr_value: "root_value" }))).to.be.true
  });

  it("updates properties from nodes, skips some and invokes callbacks if needed", function() {
    // Updating all properties
    component_dom.set("writeable_property3", "new value");
    component_dom.updatePropertiesFromNodes();
    chai.expect(component_dom.get("writeable_property3")).to.equal("writeable_property3 value");

    // Updating one property
    component_dom.set("writeable_property3", "new value");
    component_dom.updatePropertiesFromNodes({ attributes: ["writeable_property3" ]});
    chai.expect(component_dom.get("writeable_property3")).to.equal("writeable_property3 value");

    // invoking callback when updating a property
    component_dom.attribute_callbacks["writeable_property3"] = function(value, self) { }
    spy = chai.spy.on(component_dom.attribute_callbacks, "writeable_property3");
    component_dom.set("writeable_property3", "new value");
    component_dom.updatePropertiesFromNodes({ attrs: ["writeable_property3"]});
    chai.expect(spy).to.not.have.been.called;
    component_dom.updatePropertiesFromNodes({ attrs: ["writeable_property3"], invoke_callbacks: true });
    chai.expect(spy).to.have.been.called.with("writeable_property3", component_dom);
  });

  it("removes element from the dom", function() {
    var component2 = new ComponentDom();
    component2.dom_element = component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "class", attr_value: "RemovableComponent" });
    component2._removeDomElement();
    chai.expect(component_dom.firstDomDescendantOrSelfWithAttr(dom, { attr_name: "data-component-class", attr_value: "RemovableComponent" })).to.be.null;
  });

  it("finds the template element in the DOM", function() {
    component_dom._initTemplate();
    chai.expect(component_dom.template.outerHTML).to.equal('<div data-component-template="ComponentDomClass">ComponentDomClass template</div>');
  });

  it("appends child to the DOM element", function() {
    var new_element = component_dom.dom_element.ownerDocument.createElement('div');
    new_element.textContent = "new child element";
    component_dom._appendChildDomElement(new_element);
    chai.expect(Array.from(dom.children).slice(-1)[0].outerHTML).to.equal('<div>new child element</div>');
  });

  it("assigns roles from the dom_element", function() {
    component_dom._assignRolesFromDomElement();
    chai.expect(component_dom.roles).to.eql(["role1", "role2"]);
  });

  it("finds children dom elements that are to be assigned to nested components", function() {
    var child_components_els = component_dom._findChildComponentDomElements(dom);
    chai.expect(child_components_els[0].getAttribute("data-component-class")).to.equal("MyComponent");
    chai.expect(child_components_els[1].getAttribute("data-component-class")).to.equal("MyComponent2");
  });

  it("clones template and assigns it to #dom_element property", function() {
    component_dom.initDomElementFromTemplate();
    chai.expect(component_dom.dom_element.textContent).to.equal("ComponentDomClass template");
  });

});
