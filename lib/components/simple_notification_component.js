import { extend_as } from '../utils/mixin.js'
import { Cookies   } from '../utils/cookies.js'
import { Component } from '../component.js'
import { AutoShowHide  } from '../modules/auto_show_hide.js'
import { RootComponent } from '../components/root_component.js'
import { SimpleNotificationComponentBehaviors } from '../behaviors/simple_notification_component_behaviors.js'

/** The purpose of this component is to display user notifications, such as when a user successfully logs in or incorrectly fills the form.
  * Such notifications usually appear on top of the page and disappear after some time. This component if flexible enough to
  * allow you to tweak for how long a notification should be displayed, whether it should stay there until user leaves the page (permanent),
  * and also tweak the message type (so that you can add CSS code to have different notification colors for different types of messages). 
  *
  * The best part of this component is that you can invoke the notification in two different ways: programmatically, by writing
  * Dart code and initializing the component or by having a DOM element in your DOM. The latter is convenient to automatically
  * display messages on page load and is, probably, the most common way in which this component is going to be used.
  *
  * Properties description:
  *
  *   * `message` - the text that the user sees on the screen inside the element
  *
  *   * `message_type` - This property doesn't affect anything important, but if set, it automatically adds a class
  *   to the .dom_element: class="message-type-${message_type}".
  *   Then in your CSS code you can specify various styles for different types of messages.
  *
  *   * `autohide_delay` - A common practice is to have notification disappear over time.
  *   This property sets the number of seconds before the notification disappears once its displayed.
  *
  *   * `permanent` - If you want to completely disallow closing the notification, you'll need to set the permanent property to true.
  *   Then it becomes impossible to close the notification and even the close part HTML element gets hidden.
  *
  *   * `container_role` - All notifications will appear in a special DOM element called notifications container,
  *      which is a DOM element for the component identified by `container_role` property and used,
  *      which must be found in children of RootComponent.
  *
  *   Normally, you'd want to style it in such a way, so that its position is fixed and it appears somewhere on top.
  *   This property defines a selector by which such a container is identified.
  *
  *   * `ingore_duplicates`  - Most of the time it's a good idea not to show identical notifications twice.
  *   For that reason, the default behavior of SimpleNotificationComponent is to check whether there's
  *   another instance of the same class which is currently visible inside the same notifications container.
  *   The default is `true`, but if set to `false`, two more identical notifications may be shown.
  *
  */
export class SimpleNotificationComponent extends extend_as("SimpleNotificationcomponent").mix(Component).with(AutoShowHide) {

  static get behaviors() { return [SimpleNotificationComponentBehaviors]; }

  constructor(attrs=null) {
    super();

    this.attribute_names = ["message", "autohide_delay", "permanent", "message_id", "never_show_again", "cookie_options", "container_role", "message_type", "ignore_duplicates", "show_behavior", "hide_behavior", "show_hide_animation_speed"];
    this.native_events   = [`close.${this.click_event.join(",")}`, `message.${this.click_event.join(",")}`];

    this.default_attribute_values = {
      "container_role":    "simple_notifications_container",
      "permanent":         false,     // will not allow this notification to be closed
      "autohide_delay":    5000,      // will hide the notification
      "message_type":      "neutral", // adds css class "message-type-neutral"
      "never_show_again":  false,     // saves a cookie if true indicating that we shouldn't display the message next time, message_id is required in this case
      "cookie_options":    {},        // options for the cookie above
      "ignore_duplicates": true,      // if set to false, allows duplicate notifications to be displayed in the same container
      "show_behavior":      "show",   // alternative option is "slideDown"
      "hide_behavior":      "hide",   // alternative option is "slideUp"
      "show_hide_animation_speed": 500
    };

    this.visible = false;

    var on_demand = false;
    if(attrs != null) {
      this.updateAttributes(attrs);
      on_demand = true;
    }


    this.event_handlers.add({ event: this.click_event, role: "self.close", handler: (self, event) => self.hide()});
    if(on_demand) this.afterInitialize();

  }

  afterInitialize() {

    if(this.dom_element == null)
      this.initDomElementFromTemplate();

    super.afterInitialize();
    this.updatePropertiesFromNodes();

    if(this.get("permanent"))
      this.behave("hideCloseButton");

    // Attention: container must precede any simple notifications in the DOM.
    var container = RootComponent.instance.findFirstChildByRole(this.get("container_role"));
    //************************************************************************************
    // An explanation is needed for this piece of code. It may seem odd, why don't we just
    // use a regular addChild() method on container? The problem is that `addChild()` tries to
    // make use of parent setter which leads to stack overflow if the parent is already set
    // (as would be the case with notifications already loaded into DOM and not created on demand).
    //
    // And so, we have to manually add this component as a child to container, then manually append its
    // DOM element to the container's DOM element and then manually set `this.parent` to container.
    //
    // All this is done for the sake of giving users of this class freedom to either create
    // notifications on demand from code or include them into DOM and let Webface parse and create
    // notifications for you.
    container.children.push(this);
    this.parent = container;
    container.dom_element.append(this.dom_element);
    //************************************************************************************

    this.show_promise = this.show();

  }

  /** Before actually displaying the notification, this method checks whether there are duplicates
   * of the notification in the specified container. It also launches autohide() if applicable.
   */
  show() {

    // Don't show notification if `never_show_again` is true, `message_id` is passed and a cookie exists
    if(this.get("never_show_again") && (this.get("message_id") != null) && Cookies.get(`message_${this.get("message_id")}_never_show_again`) == "1")
      return new Promise((resolve,reject) => resolve());

    // Don't do anything if a similar message has been displayed before.
    if(this.get("ignore_duplicates") && this.parent != null) {
      let has_duplicate = false;
      this.root_component.findAllDescendantInstancesOf(this.constructor).forEach((n) => {
        if(n.get("message") == this.get("message") && n != this)
          has_duplicate = true;
      });
      if(has_duplicate) {
        window.webface.logger.capture(`Cannot create SimpleNotification "${this.get("message")}" because a duplicate already exists`, { log_level: "INFO" });
        this.remove();
        return new Promise((resolve,reject) => resolve());
      }
    }

    var promise = this.behave("show");
    this.visible = true;
    if(!this.get("permanent"))
      this.autohide();
    return promise;
  }

  /** Hides the notification and removes it from the parent component. */
  hide({ force=false }={}) {

    var promise;

    if(!this.get("permanent") || force) {
      promise = this.behave("hide");
      this.visible = false;
      this.parent.removeChild(this);
      if(this.get("never_show_again") && (this.get("message_id") != null))
        Cookies.set(`message_${this.get("message_id")}_never_show_again`, "1", 360);
      return promise;
    } else {
      window.webface.logger.capture(`Cannot hide SimpleNotification with id ${this.get("message_id")} because it's permanent`, { log_level: "INFO" });
      return new Promise((resolve,reject) => resolve());
    }

  }

}
window.webface.component_classes["SimpleNotificationComponent"] = SimpleNotificationComponent;
