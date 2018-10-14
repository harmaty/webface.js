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

  static get behaviors() { return [ComponentBehaviors]; }

  constructor() {
    super();
    this.behavior_instances = [];
    this.ignore_misbehavior = true;
    this._createBehaviors();
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
   * Creates behaviors by instantiating Behavior objects added into #behaviors list.
   * Called on Component intialization.
   */
  _createBehaviors() {
    if(this.behavior_instances.length > 0)
      return;
    this.constructor.behaviors.forEach(function(b) {
      this.behavior_instances.push(new b());
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
