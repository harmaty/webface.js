import { extend_as } from '../utils/mixin.js'
import { isBlank   } from '../utils/string_helpers.js'
import { Component } from '../component.js'

export class NoOptionWithSuchValue extends Error {
  constructor(cause) {
    super();
    this.message = cause;
  };
}

export class RadioButtonComponent extends extend_as("RadioButtonComponent").mix(Component).with() {

  constructor() {

    super();

    this.native_events   = ["option.change"];
    this.attribute_names = ["validation_errors_summary", "disabled", "value"];
    this.default_attribute_values = { "disabled" : false };

    /** Stores all options and their values. Filled with data from the DOM-structure upon initialization. */
    this.options = {};

    this.event_handlers.add({ event: 'change', role: "self.option", handler: (self,event) => {
      self.setValueFromOptions(event.target);
    }});

    this.attribute_callbacks["value"]    = (name, self) => self.selectOptionFromValue();
    this.attribute_callbacks["disabled"] = (name, self) => self.toggleDisabled();
  
  }
  
  afterInitialize() {
    super.afterInitialize();
    this.updatePropertiesFromNodes({ attrs: ["name", "value"], invoke_callbacks: false });
    this.updatePropertiesFromNodes({ attrs: ["disabled"], invoke_callbacks: true });
    this.findAllParts("option").forEach((p) => {
      this.options[this._convertStringValueToType(p.value)] = p;
    }, this);
    if(isBlank(this.value))
      this.setValueFromSelectedOption();
    else
      this.selectOptionFromValue();
  }

  /** Selects the radio button (makes it checked visually) based on the #value of the instance.
    * If an option with such value doesn't exist, throws an error.
    */
  selectOptionFromValue() {
    for(let k in this.options)
      this.options[k].checked = false
    if(Object.keys(this.options).includes(this.get("value"))) {
      this.options[this.get("value")].checked = true;
      this.publishEvent("change", this);
    } else if(!isBlank(this.get("value"))) {
      throw new NoOptionWithSuchValue("No option found with value `${this.value}`. You can't set a value that's not in the this.options.keys List.");
    }
  }

  /** When a radio button is clicked, we need to set the #value of the current RadioButtonComponent instance.
    * That's what this method does. The problem is, a radio element apparantely creates multiple click events
    * so we need to only react to one single event that's invoked on the radio button being selected - thus the
    * additional `if` inside.
    */
  setValueFromOptions(option_el) {
    if(option_el.checked) {
      this._assignPropertyFromNodeStringValue("value", option_el.value);
      this.publishEvent("change", this);
    }
  }

  /** This method is used to set the default #value for the RadioButtonComponent instance when our Radio is already checked on page load. */
  setValueFromSelectedOption() {
    for(let k in this.options) {
      if(this.options[k].checked)
        this._assignPropertyFromNodeStringValue("value", this.options[k].value);
    }
  }

  /* TODO: should instead be in behaviors */
  toggleDisabled() {
    findAllParts("option").forEach((option) => {
      if(this.disabled)
        option.attributes["disabled"] = "disabled";
      else
        option.attributes.remove("disabled");
    }, this);
  }

}
window.webface.component_classes["RadioButtonComponent"] = RadioButtonComponent;
