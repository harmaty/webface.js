import '../webface_init.js'
import { extend_as       } from '../lib/utils/mixin.js'
import { fetch_dom       } from '../test_utils.js'
import { RootComponent } from '../lib/components/root_component.js'
import { ModalWindowComponent } from '../lib/components/modal_window_component.js'
import { ModalWindowComponentBehaviors } from '../lib/behaviors/modal_window_component_behaviors.js'

var promise = new Promise((resolve, reject) => { resolve(true); });

// This is to avoid animator with its promises, which screws up the tests.
class TestModalWindowComponentBehaviors extends ModalWindowComponentBehaviors {
  show() { this.dom_element.style.display = "block"; return promise; }
  hide() { this.dom_element.style.display = "none"; return promise; }
  hideCloseButton() { this.component.findPart("close").remove(); }
}

class TestModalWindowComponent extends extend_as("TestModalWindowComponent").mix(ModalWindowComponent).with() {
  static get behaviors() { return [TestModalWindowComponentBehaviors]; }
}

describe("ModalWindowComponent", function() {

  var mw, dom, root;

  before(async function() {
    dom = (await fetch_dom("fixtures/modal_window_component.html"));
    var root_dom = dom.querySelector("#root");

    root = new RootComponent();
    root.dom_element = root_dom;
    root.initChildComponents();

    // ComponentDom#_initTemplate() uses this.constructor.owner_document, which
    // defaults to `document`. Since we're going to need to include this component's DOM into the
    // document anyway, makes sense to append root_dom as a child and avoid all the problems.
    document.querySelector("body").appendChild(root.dom_element);

  });

  after(function() {
    root.dom_element.remove();
  });

  describe("initialization", function() {

    it("displays a simple text as content", function() {
      mw = new TestModalWindowComponent("hello world");
      chai.expect(mw.content_el.innerText).to.eq("hello world");
    });

    it("appends HtmlElement to content_el", function() {
      var content_el = document.createElement("div");
      mw = new TestModalWindowComponent(content_el);
      chai.expect(mw.content_el.children[0]).to.eq(content_el);
    });

    it("appends child component's dom_element to content_el", function() {
      var content_component = root.findDescendantsByRole("modal_window_content")[0];
      mw = new TestModalWindowComponent(content_component);
      chai.expect(mw.content_el.children[0]).to.eq(content_component.dom_element);
      chai.expect(mw.children[0]).to.eq(content_component);
    });

    it("is added as a child of RootComponent", function() {
      mw = new TestModalWindowComponent("hello world");
      mw.roles.push("modal_window")
      chai.expect(RootComponent.instance.findDescendantsByRole("modal_window")[0]).to.eql(mw);
      chai.expect(RootComponent.instance.dom_element.children).to.include(mw.dom_element);
    });
    
  });

  describe("hiding", function() {

    describe("when close_button is clicked", function() {

      it("it hides the modal window if #show_close_button is true", function() {
        mw = new TestModalWindowComponent("hello world");
        var spy = chai.spy.on(mw, "behave");
        mw.findPart("close").dispatchEvent(new MouseEvent("click"));
        chai.expect(spy).to.have.been.called.with("hide");
      });

      it("it does nothing if #show_close_button is false", function() {
        mw = new TestModalWindowComponent("hello world", { show_close_button: false });
        chai.expect(mw.findPart("close")).to.be.null;
      });
      
      it("removes itself from RootComponent", async function() {
        mw = new TestModalWindowComponent("hello world", { show_close_button: true });
        mw.behavior_instances[0].show_hide_animation_speed = 1;
        chai.expect(RootComponent.instance.dom_element.children).to.include(mw.dom_element);
        await mw.hide();
        chai.expect(root.children).not.to.include(mw);
      });

    });

    describe("when when background is clicked", function() {

      it("it hides the modal window if #close_on_background_click is true", function() {
        mw = new TestModalWindowComponent("hello world");
        var spy = chai.spy.on(mw, "behave");
        mw.findPart("background").dispatchEvent(new MouseEvent("click"));
        chai.expect(spy).to.have.been.called.with("hide");
      });

      it("it does nothing if #close_on_background_click is false", function() {
        mw = new TestModalWindowComponent("hello world", { close_on_background_click: false });
        var spy = chai.spy.on(mw, "behave");
        mw.findPart("background").dispatchEvent(new MouseEvent("click"));
        chai.expect(spy).not.to.have.been.called.with("hide");
      });

    });

    describe("when ESC is pressed", function() {

      var esc_keypress;

      beforeEach(function() {
        esc_keypress = new KeyboardEvent("keydown", { keyCode: 27 });
      });

      it("it hides the modal window if #close_on_escape is true", function() {
        mw      = new TestModalWindowComponent("hello world");
        var spy = chai.spy.on(mw, "behave");
        mw.dom_element.dispatchEvent(esc_keypress);
        chai.expect(spy).to.have.been.called.with("hide");
      });

      it("it does nothing if #close_on_escape is false", function() {
        mw      = new TestModalWindowComponent("hello world", { close_on_escape: false });
        var spy = chai.spy.on(mw, "behave");
        mw.dom_element.dispatchEvent(esc_keypress);
        chai.expect(spy).to.have.been.called.with("hide");
      });

    });
    
  });

});
