export function mix(superclass) { return new MixinBuilder(superclass); }
export function mixins(...mixins) {
  return mix(Object).with(...mixins);
}

class MixinBuilder {  
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) {
    this.superclass.mixins = mixins.map(function(m) {
      console.log(m);
      return m.name;
    }, this);
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }

}
