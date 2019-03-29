export const ComponentDom = (ComponentDom) => class extends ComponentDom {

  /** Dom element is what it is: a DOM element in our HTML page, which is associated
   *  with the current component and to which callacks are attached (the natives ones).
   *  We need a custom setter to start listening to the native events that wi list in
   *  the #native_events property.
   */
  get dom_element() { return this._dom_element };
  set dom_element(el) {
    this._dom_element = el;
    this.use_default_attrs_for_properties_with_no_corresponding_html_attrs = true;
    if(el != null)
      this._assignRolesFromDomElement();
  }

  /** It's not always the `document` object that is used to find templates and for other things.
   * Sometimes (in unit tests, for example) it's easier to use a different custom object
   * instead of the real `document` one offered by the browser. These getter & setter
   * provide a way to replace the standard `document` object to be used.
   */
  static get owner_document() {
    if(this._owner_document == null)
      return document;
    else
      return this._owner_document;
  }
  static set owner_document(doc) {
    this._owner_document = doc;
  }

  /** Clones #template and assigns the clone to #dom_element, then sets all the properties */
  initDomElementFromTemplate() {
    if(this.template != null) {
      this.dom_element = new DOMParser().parseFromString(this.template.outerHTML, "text/html").documentElement.querySelector(`body>[data-component-template="${this.constructor.name}"]`);
      this.dom_element.removeAttribute('data-component-template');
      this.dom_element.setAttribute('data-component-class', this.constructor.name);
      this.attribute_names.forEach((a) => this._writePropertyToNode(a), this);
    }
  }

  /** Finds first DOM ancestor with a certain combination of attribute and its value,
   *  or returns the same node if that node has that combination.
   */
  ancestorOrSelfWithAttr(node, { attr_name=null, attr_value=null }={}) {
    var ancestor = node;
    while(ancestor != null && ancestor.getAttribute(attr_name) != attr_value)
      ancestor = ancestor.parentElement;
    return ancestor;
  }

  /** Same as firstDomDescendantOrSelfWithAttr, but finds all dom elements
    * and returns a List
    */
  allDomDescendantsAndSelfWithAttr(node, { attr_name=null, attr_value=null, first_only=false }={}) {
    var actual_attr_value = node.getAttribute(attr_name);

    if(attr_value instanceof RegExp && actual_attr_value != null && attr_value.test(actual_attr_value))
      return [node];
    else if(attr_name == null || node.getAttribute(attr_name) == attr_value)
      return [node];
    else if(node.children.length == 0)
      return [];

    var elements = [];
    Array.from(node.children).some(function(c) {
      if(c.getAttribute('data-component-class') == null) {
        var children_elements = this.allDomDescendantsAndSelfWithAttr(c, { attr_name: attr_name, attr_value: attr_value });
        if(children_elements != null)
          elements = elements.concat(children_elements);
        if(elements.length > 0 && first_only)
          return true;
      }
    }, this);

    return elements;
  }

  /** Finds first DOM descendant with a certain combination of attribute and its value,
   *  or returns the same node if that node has that combination.
   *
   *  This method is needed when we want to listen to #dom_element's descendant native events
   *  or when a property is changed and we need to change a correspondent descendant node.
   */
  firstDomDescendantOrSelfWithAttr(node, { attr_name=null, attr_value=null }={}) {
    var elements = this.allDomDescendantsAndSelfWithAttr(node, { attr_name: attr_name, attr_value: attr_value, first_only: true});
    return (elements != null && elements.length > 0) ? elements[0] : null;
  }

  /** Gets a list of all DOM-descendants of the #dom_element that are not included
    * into other child Component DOM-structures. The returned List lacks proper hierarchy.
    */
  allDomDescendants(node, { skip_components=true }={}) {
    var elements = [];
    if(node != null) {
      Array.from(node.children).forEach(function(c) {
        if(c.getAttribute('data-component-class') == null || !skip_components) {
          elements.push(c);
          elements = elements.concat(this.allDomDescendants(c, { skip_components: skip_components }));
        }
      }, this);
    }
    return elements;
  }

  /** Finds all HtmlElements representing parts of the current component which match the name provided. */
  findAllParts(name) {
    return this.allDomDescendantsAndSelfWithAttr(this.dom_element, { attr_name: 'data-component-part', attr_value: name });
  }

  /** Finds the first HtmlElement representing a part of the current component which matches the name provided. */
  findPart(name) {
    return this.firstDomDescendantOrSelfWithAttr(this.dom_element, { attr_name: 'data-component-part', attr_value: name });
  }

  /** Finds property node in the DOM */
  findPropertyElements(property_name) {
    var property_els = this.allDomDescendantsAndSelfWithAttr(
      this.dom_element,
      { attr_name: "data-component-property",
        attr_value: property_name
      }
    );
    if(property_els.length == 0) {
      // Try searching element with data-component-attribute-properties first
      property_els = this.allDomDescendantsAndSelfWithAttr(
        this.dom_element,
        {
          attr_name: "data-component-attribute-properties",
          // This one finds attribute properties of the format
          // property_name:html_attribute_name_for_the_property
          attr_value: new RegExp(`(^|,| +)${property_name}:`)
        }
      );

      // If we can't find those, just default to data-property-name elements
      if(property_els.length == 0 && this.use_default_attrs_for_properties_with_no_corresponding_html_attrs) {
        property_els = this.allDomDescendantsAndSelfWithAttr(
          this.dom_element,
          {
            attr_name: `data-${property_name.replace(/_/g, '-')}`,
            attr_value: new RegExp(".*")
          }
        );
      }
    }
    return property_els;
  }

  findFirstPropertyElement(property_name) {
    var els = this.findPropertyElements(property_name);
    return els.length > 0 ? els[0] : null;
  }

  /** Updates all properties values from their DOM nodes values.
    * If provided with an optional List of property names, updates only
    * properties that are on that List.
    */
  updatePropertiesFromNodes({ attrs=false, invoke_callbacks=false }={}) {
    if(attrs == false)
      attrs = this.attribute_names;
    attrs.forEach(function(a) {
      this._readPropertyFromNode(a, { run_callback: invoke_callbacks });
    }, this);
  }

  /** Reads property value from a DOM node, updates Component's object property with the value */
  _readPropertyFromNode(property_name, { run_callback=false }={}) {
    var property_el = this.findFirstPropertyElement(property_name);
    if(property_el != null) {
      var pa = property_el.getAttribute('data-component-attribute-properties');
      if(pa != null) {
        var attr_property_name = this._getHtmlAttributeNameForProperty(pa, property_name);
        var v = property_el.getAttribute(attr_property_name);
        if(v != null)
          this._assignPropertyFromNodeStringValue(property_name, v, { run_callback });
      } else if(property_el.getAttribute(`data-${property_name.replace(/_/g, "-")}`) && this.use_default_attrs_for_properties_with_no_corresponding_html_attrs ) {
        this._assignPropertyFromNodeStringValue(property_name, property_el.getAttribute(`data-${property_name.replace(/_/g, "-")}`), { run_callback });
      }
      else {
        var s = property_el.textContent;
        // Ignore whitespace. If you need to preserve whitespace,
        // use attribute-based properties instead.
        s = s.replace(/^\s+/, "");
        s = s.replace(/\s+$/, "");
        this._assignPropertyFromNodeStringValue(property_name, s, { run_callback });
      }
      if(typeof this.attributes[property_name] == "string" && this.attributes[property_name].length == 0)
        this.attributes[property_name] = null;
    }
  }

  /** Updates dom element's #text or attribute so it refelects Component's current property value. */
  _writePropertyToNode(property_name) {
    if(this.dom_element == null)
      return;
    var property_els = this.findPropertyElements(property_name);

    if(property_els.length == 0 && this.attributes[property_name] &&
       this.use_default_attrs_for_properties_with_no_corresponding_html_attrs) {
      this.dom_element.setAttribute(`data-${property_name.replace(/_/g, "-")}`, this.attributes[property_name].toString());
      return;
    }

    property_els.forEach(function(property_el) {
      if(property_el != null) {
        var pa = property_el.getAttribute('data-component-attribute-properties');
        if(pa == null) {
          let value = this.get(property_name);
          if(value != null)
            property_el.textContent = value.toString();
          else
            property_el.textContent = '';
        }
        else {
          var attr_property_name = this._getHtmlAttributeNameForProperty(pa, property_name);
          if(this.attributes[property_name] == null) {
            if(attr_property_name == "value")
              property_el.value = null;
            property_el.removeAttribute(attr_property_name);
          }
          else {
            property_el.setAttribute(attr_property_name, this.attributes[property_name].toString());
            if(attr_property_name == "value")
              property_el.value = this.attributes[property_name].toString();
          }
        }
      }
    }, this);
  }

  /** Finds whether the dom_element's descendants have a particular node
    * or if it itself is this node.
    */
  _hasNode(node, { skip_components=true }={}) {
    if(node == this.dom_element)
      return true;
    var result = false;
    this.allDomDescendants(this.dom_element, { skip_components: skip_components }).forEach(function(descendant) {
      if(node == descendant) result = true;
    });
    return result;
  }

  /** Defines behavior for removal of the #dom_element
    * Redefine this method to have something fancier (like an animation)
    * for when the #dom_element is removed.
    */
  _removeDomElement({ ignore_null_dom_element=false }={}) {
    try {
      this.dom_element.remove();
    } catch(e) {
      if(!ignore_null_dom_element) throw(e);
    }
  }

  _getHtmlAttributeNameForProperty(attr_list, property_name) {
    if(attr_list.includes(property_name)) {
      var attr_list_regexp = new RegExp(`${property_name}:[a-zA-Z0-9_\-]+`);
      var match = attr_list_regexp.exec(attr_list)
      return match == null ? null : match[0].split(':')[1];
    } else if(this.use_default_attrs_for_properties_with_no_corresponding_html_attrs) {
      return `data-${property_name.replace(/_/g, '-')}`;
    } else
      return null;
  }

  _assignPropertyFromNodeStringValue(property_name, s, { run_callback=false }={}) {
    this.set(property_name, this._convertStringValueToType(s), { run_callback: run_callback });
  }

  /** Finds the template HtmlElement in the dom and assigns it to #template */
  _initTemplate() {
    return this.template = this.constructor.owner_document.querySelector(`[data-component-template=${this.constructor.name}]`);
  }

  _assignRolesFromDomElement() {
    var roles_attr = this._dom_element.getAttribute('data-component-roles');
    if(roles_attr != null)
      this.roles = this._dom_element.getAttribute('data-component-roles').split(/,\s?/);
  }

  /**  In order to be able to instatiate nested components, we need to find descendants of the #dom_element
    *  which have data-component-class attribute. This method takes care of that.
    */
  _findChildComponentDomElements(node) {
    var component_children = [];
    Array.from(node.children).forEach(function(c) {
      if(c.getAttribute('data-component-class') == null)
        component_children = component_children.concat(this._findChildComponentDomElements(c));
      else
        component_children.push(c);
    }, this);
    return component_children;
  }

  /** This method defines a default behavior when a new child is added.
    * Makes sense to append child dom_element to the parent's dom_element.
    * Of course, this might not always be desirable, so this method may be
    * redefined in descendant calasses.
    */
  _appendChildDomElement(el) {
    this.dom_element.appendChild(el);
  }

  _convertStringValueToType(s) {
    if(["true", "false"].includes(s))
      return s == "true";
    else if(s == "null")
      return null;
    else if(/^\d+\.\d*$/.test(s)) // it's a float!
      return parseFloat(s);
    else if(/^\d+$/.test(s)) // it's an integer!
      return parseInt(s);
    else
      return s;
  }

}
