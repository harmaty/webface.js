export class TypeChecker {

  // Checks whether something is a hash (in Ruby terminology), but at the same
  // time isn't another object such as an Array. Javascript doesn't really distinguish between those,
  // and we're not comfortable using Map() all the time due to a more complex syntax of defining maps.
  static isSimpleObject(obj) {
    return (typeof obj == "object") && obj.constructor.name == "Object"
  }

  // Checks whether a particular class or one of its subclasses, or one of the mixins
  // has another mixin mixed-in.
  static hasMixin(obj, mixin_name) {

    function collect_mixins(mixins) {
      var nested_mixins = mixins;
      if(mixins != null) {
        mixins.forEach(function(m) {
          if(window.global_mixin_inheritance_tree[m] != null) {
            nested_mixins = new Set([...mixins, ...(collect_mixins(window.global_mixin_inheritance_tree[m]))]);
          }
        });
      }
      return nested_mixins;
    }
    
    if(typeof mixin_name != "string")
      mixin_name = mixin_name.name;

    var mixins = window.global_mixin_inheritance_tree[obj.constructor.name];
    if(mixins == null) return false; // Key doesn't exist, this mixin was never mixed into anything!
    
    return collect_mixins(mixins).has(mixin_name);
  }

  // Checks whether a particular class extends from another class or has a particular
  // mixin mixed-in.
  static isKindOf(obj, class_name) {
    if(typeof class_name != "string")
      class_name = class_name.name;

    let superclasses = [];
    let sc = obj.constructor;
    let i = 0;
    console.log(Object.getPrototypeOf(Object.getPrototypeOf(obj)).constructor.name);
    // First, collect the tree of all superclass names
    //while(i < 15) {
      //i = i + 1;
      //console.log(sc.name);
      //sc = sc.constructor.prototype
      //superclasses.push(sc);
    //}


  }

}
