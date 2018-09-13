import { TypeChecker } from '../lib/utils/type_checker.js'

class DummyClass {}

describe("TypeChecker", function() {
  
  it("identifies a simple object, discarding arrays, functions and instances of other classes", function() {
    chai.expect(TypeChecker.isSimpleObject({"hello" : "world"})).to.be.true
    chai.expect(TypeChecker.isSimpleObject(["hello", "world"])).to.be.false
    chai.expect(TypeChecker.isSimpleObject("hello world")).to.be.false
    chai.expect(TypeChecker.isSimpleObject(new DummyClass())).to.be.false
  });

});
