import { extend_as } from '../lib/utils/mixin.js'
import { Attributable        } from './modules/attributable.js'
import { Heritable           } from './modules/heritable.js'
import { Validatable         } from './modules/validatable.js'
import { Subscriber          } from './modules/observable_roles/subscriber.js'
import { Publisher           } from './modules/observable_roles/publisher.js'
import { EventLock           } from './modules/observable_roles/event_lock.js'
import { ComponentDom        } from './modules/component_dom.js'
import { ComponentValidation } from './modules/component_validation.js'
import { ComponentHeritage   } from './modules/component_heritage.js'
import { ComponentBehaviors  } from './behaviors/component_behaviors.js'
import { I18n                } from './i18n.js'

export class Component extends extend_as("Component").mixins(
  Attributable,
  Heritable,
  Validatable,
  Subscriber,
  Publisher,
  EventLock,
  ComponentDom,
  ComponentValidation,
  ComponentHeritage
){

  // Contains behavior classes from which objects are instantiated.
  // You can add more, for example [... ButtonBehaviors, LinkBehaviors]
  static get behaviors() { return [ComponentBehaviors]; }

  // This collection is defined here in case other components need to redefine
  // Component#attribute_callbacks, but some of the callbacks need to be the same.
  // Instead of copypasting the code, we could just reuse it by calling the methods
  // from this collection.
  static get attribute_callbacks_collection() { return {
    'write_property_to_dom' : (attr_name, self) => self._writePropertyToNode(attr_name)
  }}

  static createFromTemplate({ name=null, container=null, attrs={} }={}) {
    var component = new this({ "_template_name": name });
    component.initDomElementFromTemplate();

    component.updateAttributes(attrs);
    Object.keys(attrs).forEach((k) => component._writePropertyToNode(k, component.get(k)));

    component.afterInitialize();
    if(container) component.assignParent(container);

    return component;
  }

  constructor(options=null) {
    super();

    /** Events emitted by the browser that we'd like to handle
     *  if you prefer to not listen to them all for your component,
     *  simply list the ones you'd like to listen to, ommiting all the others.
     *
     *  native_events_list is a variable defined in native_events_list.dart
     *  and it simply contains a List of all events Dart is capable of catching.
     *  If you'd like to listen to all of those native events, uncomment it and assign
     *  native_events to it, however not that it might affect performance.
     *
     *  If you want to catch events from descendants of the #dom_element, define events as
     *  "self.part_name" where part_name is identical to the value of the data-component-part
     *  html attribute of the descendant element.
     */
    this.native_events                = []; // native_events_list;
    this.no_propagation_native_events = [];

    /** This is where Dart listeners for native events are stored, so we can cance
      * a listenere later, for example
      */
    this.native_event_listeners = {};

    /// instantiated behavior objects, don't touch it
    this.behavior_instances = [];
    // If set to true and behavior object doesn't have the behavior being invoked, silently ignore that.
    // When set to false - raises a NoSuchMethodError!
    this.ignore_misbehavior = true;

    // Replace all native click events with touchstart if it's supported.
    if('ontouchstart' in document.documentElement)
      this.click_event = ["touchend", "click"];
    else
      this.click_event = ["click"];

    this.attribute_callbacks = {
      'default' : (attr_name, self) => this.constructor.attribute_callbacks_collection['write_property_to_dom'](attr_name, self)
    };

    if(options) this.template_name = options["_template_name"];

    this._initTemplate();
    this._loadI18n();

  }

  // Redefining setter here, adding a call to _listenToNativeEvents().
  // For some reason if you redefine setter, but not getter, it doesn't work, so we need to redefine both.
  get dom_element() { return super.dom_element };
  set dom_element(el) {
    super.dom_element = el;
    if(this.dom_element != null)
      this._listenToNativeEvents();
  }

  /** Returns root_component by traversing the heritage tree until `#parent` property is empty.
    * Also cached the result, so it doesn't have to do it every time. After all,
    * in all likeihood root_component won't change.
    */
  get root_component() {
    if(this._root_component != null)
      return this._root_component;
    else if(this.parent == null && this.constructor.name == "RootComponent")
      return this._root_component = this;
    this._root_component = this.parent;
    while(this._root_component != null && !(this._root_component.constructor.name == "RootComponent") && this._root_component.parent != null)
      this._root_component = this._root_component.parent;
    return this._root_component;
  }

  /** Is run after a component is initialized by a parent component (but not manually).
    * Override this method in descendants, but don't forget to call super() inside, or
    * you'll be left without behaviors!
    */
  afterInitialize() {
    super.afterInitialize(); // some modules may use this, thus call to super.
    this.setDefaultAttributeValues();
    this._createBehaviors();
    this._i18nize_validation_messages();
  }

  /** A convenience method for creating an event handler for when parent is done initializing itself and all of its
    * children. `my_role` argument is used to uniquely identify a component. Could be dynamically generated
    * so that only this particular instance of Component is tracked by the parent. See `HintComponent` for example
    * of the usage.
    *
    * The event itself is triggered by publishEvent() ComponentHeritage#initChildComponents().
    * For the handler to actually be invoked, this method should probably be called from afterInitialize()
    * or the constructor.
    *
    * TODO: understand why we define the event handler on the current component and not on the parent!
    * After all, the event published by the parent propagates up the heritage tree, not down. This is
    * so weird. Perhaps I need to rewrite how HintComponent works.
    * */
  afterParentInitialized(my_role, handler) {
    this.parent.roles.push(my_role);
    this.parent.addObservingSubscriber(this);
    this.event_handlers.add({ event: "initialized", role: my_role, handler: handler });
  }

  /**
    Invokes behaviors which are defined in separate Behavior objects. Those objects are instantiated
    when the constructor is called. If you want to define custom Behaviors, simply create
    a MyBehaviors class and add into the #behaviors list.
  */
  behave(behavior, attrs=null) {
    if(attrs == null) attrs = [];
    for(let i in this.behavior_instances.reverse()) {
      let b = this.behavior_instances[i];
      if(!this.ignore_misbehavior || typeof b[behavior] == "function")
        return b[behavior](...attrs)
    }
  }

  /** Finds the translation for the provided key using either its own translator or
    * RootComponent's translator. */
  t(key, placeholders=null, component_name=null) {

    if(component_name == null)
      component_name = this.constructor.name;

    var i18n      = window.webface.components_i18n[component_name];
    var i18n_root = window.webface.components_i18n["RootComponent"];
    var translation;
    if(i18n != null)
      translation = i18n.t(key, placeholders);
    if(translation == null && i18n_root != null)
      translation = i18n_root.t(key, placeholders);

    if(translation == null) {
      window.webface.logger.capture(`translation missing for \"${key}\" in \"${component_name}\" translator(s).`, { log_level: "WARN" });
      translation = key.split(".").pop().replace(/_/g, " ")
    }

    return translation;
  }

  /**
    * Removes itself from the parent's children List and removes the #dom_element
    * from the DOM. In case deep is set to true, recursively calls remove() on
    * all of its children.
    *
    * Makes use of _removeDomElement() to define specific behaviors to be invoked
    * when the #dom_element is being removed from the DOM. Default is to just use
    * HtmlElement#remove(), but one might want to redefine it to have animations of
    * some sort.
   */
  remove({ deep=false, ignore_null_dom_element=false }={}) {
    if(deep) {
      this.children.forEach((c) => c.remove({ deep: true }));
      this.children = [];
    }
    if(this.parent != null) {
      let parent = this.parent;
      if(!deep) // Otherwise we'd have a "Concurrent modification during iteration" error
        this.parent.removeChild(this);
      this.parent = null;
    }
    this._removeDomElement({ ignore_null_dom_element: ignore_null_dom_element });
    this.dom_element = null;
  }

  /** Reloading obervable_roles Subscriber's method.
    * 1. call the super() method to make sure the handler is applied.
    * 2. The actual code that adds new functionality:
    *    publish event to the parent with the current component roles.
    *
    * Only those events that are called on #self are propagated up to the parent.
    * As of now, it was decided to exclude events from component parts to propagate
    * upwards - now the component itself is responsible for issuing publishEvent() calls
    * manually for each component part event handler.
  */
  captureEvent(e, publisher_roles, { data=null, prevent_default=false, is_native=false}={}) {

    // For native events, pass the Event object in data
    if(data == null && (e instanceof Event) && is_native)
      data = e;

    var event_obj = e;
    if(!(typeof e === 'string')) {
      if(this.event_handlers.hasHandlerFor({ event: e.type, role: publisher_roles }) && prevent_default)
        e.preventDefault();
      e = e.type;
    }

    if(this.hasEventLock(e, { publisher_roles: publisher_roles })) {
      event_obj.preventDefault();
      return false;
    }
    this.addEventLock(e, { publisher_roles: publisher_roles });

    super.captureEvent(e, publisher_roles, { data: data });

    // Only publish if event is the actual event of the dom_element, IS NOT
    // in non-propagate list, and is not a native event on one of the component parts.
    if(publisher_roles.includes("#self") && !this.no_propagation_native_events.includes(e)) {
      this.publishEvent(e, { "component": this, "event": event_obj });
      return;
    }

    return true;
  }

  /**
    * Reloading obervable_roles.Subscriber's method.
    * We need to check whether "pass_native_event_object" option exists
    * and if it does - we're passing the native event instead of Component
    * itself (which is the default when a descendant component publishes an event).
    */
  handleEvent(handler_and_options, data=null) {
    if(data != null) {
      if(handler_and_options["options"] != null && handler_and_options["options"]["pass_native_event_object"] == true && data["event"] != null)
        data = data["event"];
      else if(data["component"] != null)
        data = data["component"];
    }
    super.handleEvent(handler_and_options, data);
  }

   /** Reloading the obervable_roles.Subscriber's method because
    * we need to make Component listen to its own events.
    * It's marginally useful, but is very helfpul in the implementation of
    * "children_initialized" event handler.
    */
  publishEvent(e, data=null) {
    if(this.event_handlers.hasHandlerFor({ role: "#myself", event: e }))
      this.captureEvent(e, ["#myself"], { data: data });
    super.publishEvent(e,data);
  }

  /** Sometimes we need to re-create all or some event listeners for native events. This
    * is usually necessary when new elements are added onto the page - previously created
    * listeners don't really monitor them. This method is created for this specific reason.
    *
    * This method first gets rid of ALL existing listeners, the creates new listeners
    * for all events listed in `native_events` property.
    *
    * TODO: potential improvement would be to only cancel and re-create native events
    * for parts because it is unlikely we'll remove the dom_element itself.
    */
  reCreateNativeEventListeners() {
    this._cancelNativeEventListeners();
    this._listenToNativeEvents();
  }

  /* This method is useful when we need to reposition the element in the hierarchy AND the DOM.
   * In Component it is used by the Component.createFromTemplate static method to attach newly created
   * component.
   * */
  assignParent(par) {

    //************************************************************************************
    // An explanation is needed for this piece of code. It may seem odd, why don't we just
    // use a regular addChild() method on container? The problem is that `addChild()` tries to
    // make use of parent setter which leads to stack overflow if the parent is already set
    // (as would be the case with notifications already loaded into DOM and not created on demand).
    //
    // And so, we have to manually add this component as a child to container, then manually append its
    // DOM element to the container's DOM element and then manually set `this.parent` to container.
    //
    // All this is done to allow this method to work in situations when parent is already set and when it isn't.
    par.children.push(this);
    this.parent = par;
    par.dom_element.append(this.dom_element);
    //************************************************************************************

  }

  /** Starts listening to native events defined in #native_events. It is
   *  called (and thus, listeners are re-initialized) if #dom_element changes.
   *  Native events may come from the #dom_element itself or from one of its descendants.
   *  Obviously, each native event has to be listed in #native_events for it to be caught.
   *
   *  If you want to catch events from descendants of the #dom_element, define events as
   *  "self.part_name" where part_name is identical to the value of the data-component-part
   *  html attribute of the descendant element.
   */
  _listenToNativeEvents() {
    this._flattenNativeEvents();
    this.native_event_handlers = {};

    this.native_events.forEach((e) => {

      let prevent_default = true;
      if(e.startsWith('!')) {
        e = e.substring(1);
        prevent_default = false;
      }

      let original_native_event_name = e;

      // Event belongs to an html element which is a descendant of our component's dom_element
      if(e.includes('.')) {
        e = e.split('.'); // the original string is something like "text_field.click"
        let part_name  = e[0];
        let event_name = e[1];
        let part_els   = this.allDomDescendantsAndSelfWithAttr(
          this.dom_element,
          {
            attr_name: 'data-component-part',
            attr_value: part_name
          }
        );
        if(part_els != null && part_els.length > 0) {
          let self = this;
          part_els.forEach((part_el) => {
            let _listener = this.native_event_handlers[original_native_event_name] = (native_event) => {
              self.captureEvent(native_event, [`self.${part_name}`], { prevent_default: prevent_default, is_native: true });
            }
            part_el.addEventListener(event_name, _listener);
          }, this);
        }
      }
      // Event belongs to our component's dom_element
      else {
        let self = this;
        let _listener = this.native_event_handlers[original_native_event_name] = (native_event) => {
          self.captureEvent(native_event, ["#self"], { prevent_default: prevent_default, is_native: true });
        }
        this.dom_element.addEventListener(e, _listener);
      }
    }, this);
  }

  /** Sometimes event listeners need to be canceled (only in order to be re-initialized again)
    * and this method takes care of that. It is called from _cancelNativeEventListeners()
    * and is not supposed to be used anywhere else.
    */
  _cancelNativeEventListenerFor(e) {

    e = e.replace(/^!/, "");
    var original_event_name = e;
    var handler = this.native_event_handlers[e];

    e = e.split(".")
    var el = (e.length > 1 ? this.findPart(e[0]) : this.dom_element);
    var event_name = e[e.length - 1];

    el.removeEventListener(event_name, handler);
    delete this.native_event_handlers[original_event_name];
  }

  /** Cancels all existing event listeners for all native events
    * listed in `native_events` property.
    *
    * An optional List argument can be provided, in which case only
    * event listeners listed in it will be cancelled.
    *
    * It doesn't support syntax for events nested for a particular part, e.g.
    *
    *   part1.[mouseup, mousedown]
    *
    * and you should instead pass those as two separate events in an array
    *
    *   ["part1.mouseup", "part2.mousedown"]
    *
    * You can, however pass a single event name to be canceled or multiple event
    * names in an Array, it would take care of it just fine.
    */
  _cancelNativeEventListeners(event_names=null) {
    if(event_names == null)                 event_names = this.native_events;
    else if(typeof event_names == "string") event_names = [event_names];

    event_names.forEach((event_name) => this._cancelNativeEventListenerFor(event_name), this);
  }

  /**
    * This method takes care of the case when #native_events item may look like this: part_name.[click, touchend]
    * Right now it happens when Component#click_event is set to ["click", "touchend"].
    * This method splits such item into two items properly, so that the resulting native_events List is flat.
    * Example:
    *
    *   Original native_events list: ["mouseover", "!submit.[click, touchend]", "![keypress, keydown]", "[event1, event3]"]
    *   will be converted into:      ["mouseover", "!submit.click", "!submit.touchend", "!keypress", "!keydown", "event1", "event3"]
    */
  _flattenNativeEvents() {
    var flattened_native_events = [];
    this.native_events.forEach((event) => {
      if(event instanceof Array) {
        event.forEach((e) => flattened_native_events.push(e));
      } else if(/\[.*?\]/.test(event)) {

        let sub_events;
        let prefix      = "";
        let exclamation = "";

        if(event.startsWith("!")) {
          event = event.substring(1);
          exclamation = "!";
        }

        if(/^[^.]+\.\[.*?\]/.test(event)) {
          var event_arr = event.split(".");
          prefix = `${event_arr[0]}.`;
          sub_events = event_arr[1].replace(/(\[|\])/, "").split(",");
        } else {
          sub_events = event.replace(/(\[|\])/, "").split(",");
        }
        sub_events.forEach((e) => {
          e = e.trim().replace(/]$/, "");
          flattened_native_events.push(`${exclamation}${prefix}${e}`);
        });
      } else {
        flattened_native_events.push(event);
      }
    }, this);
    this.native_events = flattened_native_events;
  }

  /**
   * Creates behaviors by instantiating Behavior objects added into #behaviors list.
   * Called on Component intialization.
   */
  _createBehaviors() {
    if(this.behavior_instances.length > 0)
      return;
    this.constructor.behaviors.forEach((b) => {
      this.behavior_instances.push(new b(this));
    }, this);
  }

  _loadI18n(doc=document) {

    if(window.webface.components_i18n == null) window.webface.components_i18n = {};

    var class_names = [];
    class_names.push(`i18n_${this.constructor.name}`);

    var parent_class = this;
    var parent_class_name = parent_class.constructor.name;

    do {
      parent_class      = Object.getPrototypeOf(parent_class.constructor);
      parent_class_name = parent_class.name;
      if(parent_class_name.endsWith("Component"))
        class_names.push(`i18n_${parent_class_name}`);
    } while(parent_class_name.endsWith("Component"));

    var i18n = new I18n(class_names.reverse(), doc);
    if(i18n != null) {
      i18n.print_console_warning   = false;
      i18n.return_key_on_not_found = false;
      window.webface.components_i18n[this.constructor.name] = i18n;
    }

  }

}
window.webface.component_classes["Component"] = Component;
