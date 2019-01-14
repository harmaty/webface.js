import { extend_as }          from '../utils/mixin.js'
import { ComponentBehaviors } from '../behaviors/component_behaviors.js'

export class SimpleNotificationComponentBehaviors extends extend_as("SimpleNotificationComponentBehaviors").mix(ComponentBehaviors).with() {

  get anchor_el() { return this.component.anchor_el };

  constructor(c) {
    super(c);
    this.pos.base_offset = { "x": -30, "y": 15, "units": "px" };
  }

  show() {
    this.dom_element.classList.add(`message-type-${this.component.message_type}`);
    return this.animator.show(this.dom_element, this.show_hide_animation_speed);
  }

  hide() {
    var f = this.animator.hide(this.dom_element, this.show_hide_animation_speed);
    f.then((r) => this.dom_element.remove());
    return f;
  }

  hideCloseButton() {
    var close_button = this.component.findPart("close");
    if(close_button != null)
      close_button.remove();
  }

}
