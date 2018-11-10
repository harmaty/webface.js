import { extend_as }          from '../utils/mixin.js'
import { ComponentBehaviors } from '../behaviors/component_behaviors.js'

export class ButtonComponentBehaviors extends extend_as("ButtonComponentBehaviors").mix(ComponentBehaviors).with() {

  constructor(c) {
    super(c);
    var ai = document.querySelector(".ajaxIndicator");
    if(ai != null)
      this.ajax_indicator = ai.clone(true);

  }

  disable() {
    this.dom_element.setAttribute("disabled", "disabled");
  }

  enable() {
    this.dom_element.removeAttribute("disabled");
  }

  lock() {
    super.lock();
  }

  unlock() {
    if(this.ajax_indicator != null)
      this.ajax_indicator.remove();
    this.component.event_locks.remove(Component.click_event);
    super.unlock();
  }
}
