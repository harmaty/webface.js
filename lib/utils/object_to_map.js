export default function object_to_map(obj) {
  var map = new Map();
  Object.keys(obj).forEach(k => map.set(k, obj[k]));
  return map;
}
