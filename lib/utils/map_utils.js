export function object_to_map(obj) {
  var map = new Map();
  Object.keys(obj).forEach(function(k) {
    if(!(["string", "number", "function"].includes(typeof obj[k])) && !(obj[k] instanceof Array))
      obj[k] = object_to_map(obj[k]);
    map.set(k, obj[k]);
  });
  return map;
}

export function merge_maps(map1, map2, { deep=false }={}) {
  map2.forEach(function(v,k) {
    if(deep && map1.get(k) instanceof Map && v instanceof Map)
      map1.set(k, merge_maps(map1.get(k), v, { deep: true }));
    else
      map1.set(k, v);
  }, this);
  return map1;
}
