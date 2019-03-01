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
  "response_type": "json",
  "throw_on_wrong_response_type": true,
  "authenticity_token_header_name": "X-CSRF-Token",
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

  "make": function(url, method="GET", {
                          params=null,
                          display_40x=AjaxRequest.display_40x,
                          auth_token=document.body.getAttribute("data-authenticity-token"),
                          error_handler=AjaxRequest.error,
                          user_notification=AjaxRequest.user_notification,
                          response_type=AjaxRequest.response_type,
                          throw_on_wrong_response_type=AjaxRequest.throw_on_wrong_response_type,
                          authenticity_token_header_name=AjaxRequest.authenticity_token_header_name
  }={}) {


    if(method == "GET") {
      // if URL doesn't include the domain part and starts with "/", assume it's the same domain
      if(url.startsWith("/")) url = location.protocol+'//'+location.hostname+(location.port ? (':' + location.port) : '') + url;
      // convert params to GET url params
      url = new URL(url);
      if(params) Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      params = undefined;
    } else {
      params = JSON.stringify(params);
    }

    if(this.log_request)
      window.webface.logger.report(`sent ${method} ajax request to ${url},\n\tparams:${params || ""}`, { log_level: "INFO" });

    var headers = {};
    headers["Accept"]       = "application/json";
    headers["Content-Type"] = "application/json";
    headers[authenticity_token_header_name] = auth_token;

    var status;

    var request = fetch(url, { method: method, body: params, headers: headers })
      .then(function(response) {
        if(response.ok)
          return Promise.resolve(response);
        else
          return Promise.reject(new AjaxRequestError(response));
      })
      .then(function(response) {
        status = response.status;
        return response.text();
      })
    // parse response as JSON
    .then(function(data) {
      if(AjaxRequest.log_response)
        window.webface.logger.report(`ajax request to ${url} ${params || ""}, returned status ${status}\n\tand a response: ${JSON.stringify(data)}`, { log_level: "INFO" });

      if(response_type == "json") {
        try {
          data = JSON.parse(data)
          if(data.error != null && user_notification)
            user_notification(data.error);
          return data;
        }
        catch(e) {
          if(e.constructor.name != "SyntaxError" || throw_on_wrong_response_type) throw(e);
          else return data;
        }
      } else {
        return data;
      }

      return data;
    }).catch(error => error_handler(error, user_notification, { display_40x: display_40x }));

    return request;

  },

  "get": function(url, params={}) {
    return this.make(url, "GET", { params: params });
  },
  "post": function(url, params) {
    return this.make(url, "POST", { params: params });
  },
  "put": function(url, params={}) {
    params["_method"] = "PUT";
    return this.make(url, "POST", { params: params });
  },
  "patch": function(url, params={}) {
    params["_method"] = "PATCH";
    return this.make(url, "POST", { params: params });
  },
  "delete": function(url, params={}) {
    params["_method"] = "DELETE";
    return this.make(url, "POST", { params: params });
  }

}
