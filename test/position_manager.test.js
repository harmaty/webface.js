import '../webface_init.js'
import { PositionManager } from './lib/position_manager.js'
import { fetch_dom       } from '../test_utils.js'

describe("PositionManager", function() {

  var dom, pos, el;

  before(async function() {
    dom = (await fetch_dom("fixtures/position_manager.html")).querySelector("#root");
    el  = dom.querySelector("#positioned");
    pos = new PositionManager();
  });

  beforeEach(function() {
    document.querySelector("body").appendChild(dom);
    dom.style.width  = "100px";
    dom.style.height = "100px";
    el.style.width   = "20px"
    el.style.height  = "10px"
  });

  afterEach(function() {
    pos.placeAt(el, 0, 0);
  });

  after(function() {
    dom.remove();
  });

  it("gets element relative position", function() {
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 0, 'y' : 0 });
  });

  it("gets element dimensions", function() {
    chai.expect(pos.getDimensions(el)).to.eql({ 'x' : 20, 'y' : 10 });
  });

  it("places element at the correct position relative to its parent", function() {
    pos.placeAt(el, 50, 50);
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 50, 'y' : 50 });
  });

  it("positions element inside its parent using relative measures", function() {
    pos.placeBy(el, dom, { left: 0.5, top: 0.5, gravity_top: 0.5, gravity_left: 0.5 });
    chai.expect(pos.getRelPosition(el, dom)).to.eql({ 'x' : 40, 'y' : 45 });
  });

});
