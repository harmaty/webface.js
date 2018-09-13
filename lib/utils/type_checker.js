export class TypeChecker {

  // Checks whether something is a hash (in Ruby terminology), but at the same
  // time isn't another object such as an Array. Javascript doesn't really distinguish between those,
  // and we're not comfortable using Map() all the time due to a more complex syntax of defining maps.
  static isSimpleObject(obj) {
    return (typeof obj == "object") && obj.constructor.name == "Object"
  }

}
