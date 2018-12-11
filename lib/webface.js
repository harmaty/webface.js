import { Logmaster                 } from './logmaster.js'
import { Component                 } from './component.js'
import { RootComponent             } from './components/root_component.js'
import { ButtonComponent           } from './components/button_component.js'
import { CheckboxComponent         } from './components/checkbox_component.js'
import { FormFieldComponent        } from './components/form_field_component.js'
import { NumericFormFieldComponent } from './components/numeric_form_field_component.js'

export var Webface = {

  "init": (root_el=document.querySelector("body")) => {

    window.webface["logger"] = new Logmaster({test_env: false})

    var root = new RootComponent();
    root.dom_element = root_el;
    root.initChildComponents();

  },

}
