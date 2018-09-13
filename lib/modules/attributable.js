/**
  * Allows you to easily define getters/setters for attributes on your class
  * and invoke callbacks when those attributes change.
  *
  * Please see README for explanation and code samples and ../examples/ for 
  * an example of a class that employs attributable.
  */
export const Attributable = (Attributable) => class extends Attributable {

  constructor() {

    super();

    // A Map of all the callbacks for the attributes that are invoked when an attribute changes.
    this.attribute_callbacks = {};

    // Attributes names and values for them, stored as a map. Do not fuck with this
    // property. Read from it, but don't write.
    this.attributes = {};

    // Previous attribute values end up here. Useful to find out whether something has changed.
    this.attribute_old_values = {};

    // This property defines which attributes get to be attributes: they will have defined
    // getters and setters for them.
    this.attribute_names = [];

    // Sometimes we want to set attributes to their default value.
    // the #setDefaultAttributeValues does exactly for each attribute name and value listed
    // in this property.
    this.default_attribute_values = {};

  }

  get(name) {
    var old = false;
    if(name.startsWith("_old_")) {
      name = name.replace("_old_", "");
      old  = true;
    }

    this._attrExistsOrThrow(name);
    return old ? this.attribute_old_values[name] : this.attributes[name];
  }

  set(name, value, { run_callback=true } = {}) {
    this._attrExistsOrThrow(name);
    this.attribute_old_values[name] = this.attributes[name];
    this.attributes[name] = value;
    if(run_callback)
      this.invokeAttributeCallback(name);
  }

  /**
   * Invokes a callback for a given attribute. If no callback for that specific attribute is defined,
   * invokes a callback named `default` (if that one is defined, of course).
   */
  invokeAttributeCallback(name) {
    this._attrExistsOrThrow(name);
    if(this.attribute_callbacks[name] != null) {
      this.attribute_callbacks[name](name, this);
    } else if(this.attribute_callbacks['default'] != null) {
      this.attribute_callbacks['default'](name, this);
    }
  }

  /**
   * Checks whether a given attribute had a previous value different from the current one.
   */
  hasAttributeChanged(name) {
    this._attrExistsOrThrow(name);
    return !(this.attributes[name] == this.attribute_old_values[name]);
  }

  /**
   * Updates registered attributes with values provided, then run callbacks on them.
   * Optionally, one can provide a function to be run after the attributes
   * are set (`callback` attribute). If this function evalutes to false, no callbacks
   * would be run (useful in validations).
   *
   * If ignore_non_existent is set to true, it will not raise error while trying
   * to update non-existent attributes.
   */
  updateAttributes(names_and_values, { condition=function() { return true; }, ignore_non_existent=false } = {}) {
    for(let k in names_and_values) {
      if(!k.includes(".") && (this.attribute_names.includes(k) || ignore_non_existent == false))
        this.set(k,names_and_values[k], { run_callback: condition() });
    }
  }

  setDefaultAttributeValues() {
    for(let k in this.default_attribute_values) {
      if(this.attributes[k] == null)
        this.attributes[k] = this.default_attribute_values[k];
    }
  }

  _attrExistsOrThrow(name) {
    if(!(this.attribute_names.includes(name)))
      throw new UndefinedAttributeError(`Attribute \`${name}\` doesn't exist`);
  }

}

export class UndefinedAttributeError extends Error {}
