import { mixins, mix } from '../lib/utils/mixin.js'

const Mixin1 = (Mixin1) => class extends Mixin1 {}
const Mixin2 = (Mixin2) => class extends mix(Mixin2).with(Mixin1) {}

class MyClass extends mixins(Mixin1, Mixin2) {}

describe("mixin", function() {

  it("shows complete history of all mixed-in modules", function() {
    var obj = new MyClass();
    chai.expect(obj.constructor.mixins).to.eql(["Mixin1", "Mixin2"]);
  });
  
});
