import '../webface_init.js'
import { AjaxRequest } from './lib/ajax_request.js'

describe("AjaxRequest", async function() {

  var url = "http://localhost:8080/ajax_test";

  it("makes a successful ajax request and returnes data to the handler", async function() {
    var result;
    await AjaxRequest.make(url, data => result = data, "POST", { params: { "hello" : "world" }});
    // server basically responds with the same params
    chai.expect(result).to.eql({ "hello" : "world" });
  });

  it("has a shortcut method for GET and POST ajax requests", async function() {
    var get_result, post_result;
    await AjaxRequest.get(url,  { "hello" : "world" }, data => get_result  = data);
    await AjaxRequest.post(url, { "hello" : "world" }, data => post_result = data);
    chai.expect(get_result).to.eql({ "hello" : "world" });
    chai.expect(post_result).to.eql({ "hello" : "world" });
  });

  it("has shortcut methods for PUT, PATCH and DELETE requests as accepted by Ruby On Rails", async function() {
    var put_result, patch_result, delete_result;
    await AjaxRequest.put(url,    { "hello" : "world" }, data => put_result    = data);
    await AjaxRequest.patch(url,  { "hello" : "world" }, data => patch_result  = data);
    await AjaxRequest.delete(url, { "hello" : "world" }, data => delete_result = data);
    chai.expect(put_result).to.eql({ "hello" : "world", "_method": "PUT" });
    chai.expect(patch_result).to.eql({ "hello" : "world", "_method": "PATCH" });
    chai.expect(delete_result).to.eql({ "hello" : "world", "_method": "DELETE" });
  });

  it("invokes #error and #user_notification callbacks if an error occurs", async function() {
    var user_error, result;
    AjaxRequest.user_notification = message => user_error = message;
    try {
      await AjaxRequest.put(url + "/error", { "hello" : "world" }, data => put_result = data);
      result = true; // no supposed to be called!
    } catch(AjaxRequestError)  {
      chai.expect(user_error).to.equal("Failed to connect to http://localhost:8080/ajax_test/error, Not Found (404)");
    }
    chai.expect(result).to.be.undefined;
  });

  it("displays notification errors about the 40x statuses to the user", async function() {
    var user_error;
    AjaxRequest.user_notification = message => user_error = message;
    AjaxRequest.display_40x = false;
    try {
      await AjaxRequest.put(url + "/error", { "hello" : "world" }, data => put_result = data);
    } catch(AjaxRequestError)  {
      chai.expect(user_error).to.be.undefined;
    }
  });

  it("displays an error message to the user if response data contains 'error' key", async function() {
    var user_error;
    AjaxRequest.user_notification = message => user_error = message;
    await AjaxRequest.post(url, { "hello" : "world", "error": "error message" }, data => put_result = data);
    chai.expect(user_error).to.equal("error message");
  });
  
});
