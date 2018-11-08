class ButtonComponentBehaviors extends ComponentBehaviors {

  Component component;
  Element   ajax_indicator;

  ButtonComponentBehaviors(Component c) : super(c) {
    var ai = querySelector(".ajaxIndicator");
    if(ai != null)
      this.ajax_indicator = ai.clone(true);
    this.component = c;
  }

  disable() {
    this.dom_element.attributes["disabled"] = "disabled";
  }

  enable() {
    this.dom_element.attributes.remove("disabled");
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
