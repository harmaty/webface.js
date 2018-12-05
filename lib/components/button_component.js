import { extend_as } from '../utils/mixin.js'
import { Component } from '../component.js'
import { ButtonComponentBehaviors } from '../behaviors/button_component_behaviors.js'

export class ButtonComponent extends extend_as("ButtonComponent").mix(Component).with() {

  static get behaviors() { return [ButtonComponentBehaviors]; }

  constructor() {
    super();

    this.attribute_names          = ["caption", "disabled", "lockable"];
    this.native_events            = [this.click_event];
    this.event_lock_for           = [this.click_event];
    this.default_attribute_values = { "lockable": true, "disabled": false };

    this.event_handlers.add({ event: this.click_event, role: "#self", handler: (self,event) => {
      if(self.get("lockable") == true) {
        self.behave("lock");
        self.addEventLock(self.click_event);
      }
    }});

    this.attribute_callbacks["disabled"] = (attr_name,self) => {
      if(self.get("disabled"))
        this.behave("disable");
      else
        this.behave("enable");
    };
  }

  afterInitialize() {
    super.afterInitialize();
    this.updatePropertiesFromNodes({ attrs: ["lockable", "disabled"], invoke_callbacks: true });
    if(this.get("lockable") == false)
      this.click_event.forEach(e => this._event_lock_for.delete(e));
  }

}
window.webface.component_classes["ButtonComponent"] = ButtonComponent;
