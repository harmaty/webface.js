import { Component } from './lib/component.js'

describe("Component", function() {

  var component;

  beforeEach(function() {
    component = new Component();
  });

  it("inherits from Attributable", function() {
    chai.expect(typeof component.hasAttributeChanged === "function").to.be.true;
  });

});
