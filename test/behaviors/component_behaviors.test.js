import '../webface_init.js'
import { extend_as     } from '../lib/utils/mixin.js'
import { fetch_dom     } from '../test_utils.js'
import { Component     } from '../lib/component.js'
import { RootComponent } from '../lib/components/root_component.js'

class DummyComponent extends extend_as("DummyComponent").mix(Component).with() {
  constructor() { super(); }
  externalClickCallback() {}
}
window.webface.component_classes["DummyComponent"] = DummyComponent;

describe("RootComponent", function() {

});
