import { extend_as } from '../utils/mixin.js'
import { Component } from '../component.js'

export class ButtonComponent extends extend_as("ButtonComponent").mix(Component).with() {

  //static get behaviors() { return [ButtonComponentBehaviors]; }

  constructor() {
    super();


    this.attribute_names          = ["caption", "disabled", "lockable"];
    this.native_events            = [`![${this.click_event.join(',')}]`];
    this.event_lock_for           = [`![${this.click_event.join(',')}]`];
    this.default_attribute_values = { "lockable": true, "disabled": false };

    this.event_handlers.add({ event: this.click_event, role: "#self", handler: (self,event) => {
      if(self.get("lockable") == true)
        self.behave("lock");
    }});


    this.attribute_callbacks["disabled"] = (attr_name,self) => {
      if(self.get("disabled"))
        console.log("disabled"); //this.behave("disable");
      else
        console.log("enabled"); //this.behave("enable");
    };
  }

  afterInitialize() {
    super.afterInitialize();
    this.updatePropertiesFromNodes({ attrs: ["lockable", "disabled"], invoke_callbacks: true });
    if(this.get("lockable") == false)
      this.event_lock_for.remove(this.click_event);
  }

}
window.webface.component_classes["ButtonComponent"] = ButtonComponent;
