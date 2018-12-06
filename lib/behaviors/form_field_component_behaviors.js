import { extend_as }          from '../utils/mixin.js'
import { ComponentBehaviors } from '../behaviors/component_behaviors.js'

export class FormFieldComponentBehaviors extends extend_as("FormFieldComponentBehaviors").mix(ComponentBehaviors).with() {

  get validation_errors_summary_element() {
    return this.component.firstDomDescendantOrSelfWithAttr(
      this.dom_element, { attr_name: 'data-component-property', attr_value: 'validation_errors_summary' }
    );
  }

  showErrors() {
    this.component.children.forEach(c => c.behave("showErrors"));
    this.dom_element.classList.add('errors');
    if(this.validation_errors_summary_element != null)
      this.validation_errors_summary_element.style.display = 'block';
  }

  hideErrors() {
    this.component.children.forEach(c => c.behave("hideErrors"));
    this.dom_element.classList.remove('errors');
    if(this.validation_errors_summary_element != null)
      this.validation_errors_summary_element.style.display = 'none';
  }

  disable() {
    this.component.value_holder_element.setAttribute("disabled", "disabled");
    this.component.disabled = true;
  }

  enable() {
    this.component.disabled = false;
    this.component.value_holder_element.removeAttribute("disabled");
  }

}
