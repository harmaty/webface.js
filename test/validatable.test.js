import mixin from './lib/utils/mixin.js'
import { Validatable  } from './lib/validatable.js'
import { Attributable } from './lib/attributable.js'

class MyValidator {
  _validateCustomStuff2(v) { return false; }
}

class Dummy extends mixin(Attributable, Validatable) {

  constructor() {
    super();

    this.attribute_names = ['num1', 'num2', 'num3', 'enum1', 'enum2', 'null1', 'str1', 'str2', 'str3', 'str4', 'not_null1', 'not_empty1', 'custom_message1', 'custom_function_attr', "custom_function_attr2"];

    this.validations = {
      'num1'  : { 'isNumeric'  : true },
      'num2'  : { 'isLessThan' : 10   },
      'num3'  : { 'isMoreThan' : 15   },

      'enum1' : { 'isOneOf'    : [1,2,3] },
      'enum2' : { 'isNotOneOf' : [1,2,3] },

      'str1'  : { 'isLongerThan'     : 5  },
      'str2'  : { 'isShorterThan'    : 10 },
      'str3'  : { 'hasExactLengthOf' : 20 },
      'str4'  : { 'matches'          : /^You're the one/ },

      'not_null1'  : { 'isNotNull'  : true },
      'not_empty1' : { 'isNotEmpty' : true },

      'custom_message1' :  { 'isNotEmpty' : { 'value': true, 'message': "CUSTOM MESSAGE" } },
      'custom_function_attr' :  { 'function' : { 'name': 'validateCustomStuff', 'message': "FUNCTION RETURNED FALSE" }},
      'custom_function_attr2' : { 'object': new MyValidator(), 'function' : { 'name': 'validateCustomStuff2', 'message': "FUNCTION RETURNED FALSE" }}
    };
  }

  _validateCustomStuff() {
    return this.get("custom_function_attr") != "error";
  }

}

describe('Validatable', function() {

  var dummy;

  beforeEach(function() {
    dummy = new Dummy();
  });

  /* NUMERIC VALIDATIONS */
  it("validates field is numeric", function() {
    dummy.set('num1', 'non numeric value');
    dummy.validate();
    chai.expect(dummy.validation_errors['num1']).to.not.be.empty
    dummy.set('num1', '100');
    dummy.validate();
    chai.expect(dummy.validation_errors['num1']).to.be.empty
  });

  it("validates field is numeric and less than a certain value", function() {
    dummy.set("num2", "12");
    dummy.validate();
    chai.expect(dummy.validation_errors['num2']).to.not.be.empty;
    dummy.set("num2", "9");
    dummy.validate();
    chai.expect(dummy.validation_errors['num2']).to.be.empty;
  });

  it("validates field is numeric and more than a certain value", function() {
    dummy.set("num3", "14");
    dummy.validate();
    chai.expect(dummy.validation_errors['num3']).to.not.be.empty;
    dummy.set("num3", "17");
    dummy.validate();
    chai.expect(dummy.validation_errors['num3']).to.be.empty;
  });

  /* ENUM VALIDATIONS */
  it('validates field is one of the values', function() {
    dummy.set("enum1", 14);
    dummy.validate();
    chai.expect(dummy.validation_errors['enum1']).to.not.be.empty;
    dummy.set("enum1", 1);
    dummy.validate();
    chai.expect(dummy.validation_errors['enum1']).to.be.empty;
  });

  it('validates field is not of the values', function() {
    dummy.set("enum2", 1);
    dummy.validate();
    chai.expect(dummy.validation_errors['enum2']).to.not.be.empty;
    dummy.set("enum2", 14);
    dummy.validate();
    chai.expect(dummy.validation_errors['enum2']).to.be.empty;
  });

  /* STRING VALIDATIONS */
  it('validates field length is no more than a certain value', function() {
    dummy.set("str1", "hello");
    dummy.validate();
    chai.expect(dummy.validation_errors['str1']).to.not.be.empty;
    dummy.set("str1", "hello world");
    dummy.validate();
    chai.expect(dummy.validation_errors['str1']).to.be.empty;
  });

  it('validates field length is no less than a certain value', function() {
    dummy.set("str2", "hello world");
    dummy.validate();
    chai.expect(dummy.validation_errors['str2']).to.not.be.empty;
    dummy.set("str2", "hello");
    dummy.validate();
    chai.expect(dummy.validation_errors['str2']).to.be.empty;
  });

  it('validates field length is exactly the value', function() {
    dummy.set("str3", "12345678901234567890a");
    dummy.validate();
    chai.expect(dummy.validation_errors['str3']).to.not.be.empty;
    dummy.set("str3", "12345678901234567890");
    dummy.validate();
    chai.expect(dummy.validation_errors['str3']).to.be.empty;
  });

  it('validates field matches the pattern', function() {
    dummy.set("str4", "I know, you're the one");
    dummy.validate();
    chai.expect(dummy.validation_errors['str4']).to.not.be.empty;
    dummy.set("str4", "You're the one");
    dummy.validate();
    chai.expect(dummy.validation_errors['str4']).to.be.empty;
  });

  it('validates field is not null', function() {
    dummy.set("not_null1", null);
    dummy.validate();
    chai.expect(dummy.validation_errors['not_null1']).to.not.be.empty;
    dummy.set("not_null1", "");
    dummy.validate();
    chai.expect(dummy.validation_errors['not_null1']).to.be.empty;
  });

  it('validates field is not empty', function() {
    dummy.set("not_empty1", "");
    dummy.validate();
    chai.expect(dummy.validation_errors['not_empty1']).to.not.be.empty;
    dummy.set("not_empty1", "not empty");
    dummy.validate();
    chai.expect(dummy.validation_errors['not_empty1']).to.be.empty;
  });

  it('allows custom validation error messages', function() {
    dummy.set("custom_message1", "");
    dummy.validate();
    chai.expect(dummy.validation_errors['custom_message1'][0]).to.equal('CUSTOM MESSAGE');
  });

  /* CUSTOM FUNCTION VALIDATIONS */
  it("validates using a custom function", function() {
    dummy.set("custom_function_attr", "error");
    dummy.validate();
    chai.expect(dummy.validation_errors['custom_function_attr'][0]).to.equal('FUNCTION RETURNED FALSE');
  });

  it("accepts object on which to call the passed function", function() {
    dummy.set("custom_function_attr2", "error");
    dummy.validate();
    chai.expect(dummy.validation_errors['custom_function_attr2'][0]).to.equal('FUNCTION RETURNED FALSE');
  });

});
