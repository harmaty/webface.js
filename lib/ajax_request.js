import { cast_map_values, merge_maps } from './utils/map_utils.js'

export class AjaxRequestError extends Error {
  constructor(response) {
    super();
    this.url     = response.url;
    this.status  = response.status;
    this.message = `Failed to connect to ${response.url}, ${response.statusText} (${this.status})`;
    this.responseBody = response.body
  }
}

export var AjaxRequest = {

  "display_40x":  true,
  "log_request":  true,
  "log_response": true,
  "error": (error, user_notification, { display_40x=true }={}) => {
    if(error instanceof Error) {
      // do not display user notifications on status 40x unless the flag is set to true
      if(user_notification && (display_40x || !(error.status >= 400 && error.status < 500)))
         user_notification(error.message);
      throw error;
    } else {
      if(user_notification) user_notification(error);
      throw new Error(error);
    }
  },
  "user_notification": message => {
    // Put code that informs user of a bad ajax-request here
    // By default if does nothing.
  },

  "make": async function(url, success_handler, method="GET", {
                          params=null,
                          display_40x=AjaxRequest.display_40x,
                          auth_token=document.body.attributes["data-authenticity-token"],
                          error_handler=AjaxRequest.error,
                          user_notification=AjaxRequest.user_notification
  }={}) {


    if(method == "GET") {
      // convert params to GET url params
      url = new URL(url);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      params = undefined;
    } else {
      params = JSON.stringify(params);
    }

    if(this.log_request)
      window.webface.logger.capture(`sent ${method} ajax request to ${url},\n\tparams:${params || ""}`, { log_level: "INFO" });

    var headers = {};
    headers["Accept"]       = "application/json";
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = auth_token;

    var status;

    await fetch(url, { method: method, body: params, headers: headers })
      .then(function(response) {
        if(response.ok)
          return Promise.resolve(response);
        else
          return Promise.reject(new AjaxRequestError(response));
      })
      .then(function(response) {
        status = response.status;
        return response.json();
      }) // parse response as JSON
      .then(function(data) {
        if(AjaxRequest.log_response)
          window.webface.logger.capture(`ajax request to ${url} ${params || ""}, returned status ${status}\n\tand a response: ${JSON.stringify(data)}`, { log_level: "INFO" });
        if(data.error == null)
          success_handler(data);
        else if(user_notification)
          user_notification(data.error);
      })
      .catch(error => error_handler(error, user_notification, { display_40x: display_40x }))

  },

  "get": async function(url, params, success_handler) {
    await this.make(url, success_handler, "GET", { params: params });
  },
  "post": async function(url, params, success_handler) {
    await this.make(url, success_handler, "POST", { params: params });
  },
  "put": async function(url, params, success_handler) {
    params["_method"] = "PUT";
    await this.make(url, success_handler, "POST", { params: params });
  },
  "patch": async function(url, params, success_handler) {
    params["_method"] = "PATCH";
    await this.make(url, success_handler, "POST", { params: params });
  },
  "delete": async function(url, params, success_handler) {
    params["_method"] = "DELETE";
    await this.make(url, success_handler, "POST", { params: params });
  }

}
