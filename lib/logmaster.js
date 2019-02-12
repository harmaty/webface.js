export class Logmaster {

  static get LOG_LEVELS() { return {
    'DEBUG': 0,
    'INFO' : 1,
    'WARN' : 2,
    'ERROR': 3,
    'FATAL': 4
  }};

  constructor({ reporters={ "console" : "DEBUG", "http" : "ERROR" }, throw_errors=true, test_env=false, http_report_url="/report_webface_error"}={}) {
    this.reporters    = reporters;    // setting log_level for a particular reporter to null deactivates a reporter.
    this.throw_errors = throw_errors; // if set to true, after reports have been sent, raises errors
    this.test_env     = test_env;     // affects console.log() output.
    this.last_error = {};
    this.http_report_url = http_report_url;
  }

  capture(message, { log_level=null, stack_trace="" }={}) {

    if(log_level == null)
      if(typeof message == "string")
        log_level = "INFO";
      else
        log_level = "ERROR";

    var error = null;
    if(typeof message != "string") {
      error       = message;
      stack_trace = message.stack.split("\n");
      message     = stack_trace[0];
      stack_trace = stack_trace.slice(1, stack_trace.length-1).join("\n")
    }

    this.report(message, log_level, stack_trace);

    if(error != null && this.throw_errors)
      throw(message);

  }

  report(message, log_level, stack_trace="") {
    this.last_error = { "message" : message, "log_level": log_level, "stack_trace": stack_trace };
    Object.keys(this.reporters).forEach(function(r) {
      if(this.reporters[r] != null && Logmaster.LOG_LEVELS[log_level] >= Logmaster.LOG_LEVELS[this.reporters[r]])
        this[`_report_to_${r}`](message, log_level, stack_trace)
    }, this);

  }

  _report_to_console(message, log_level, stack_trace) {

    // No need to print the error into the console if it was already thrown there.
    if(this.throw_errors && log_level >= Logmaster.LOG_LEVELS["ERROR"])
      return;

    this._print(`${log_level}: ${message}`);
    if(stack_trace != null && stack_trace != "")
      this._print(stack_trace);

  }

  _report_to_http(message, log_level, stack_trace) {
    var self = this;
    fetch(this.http_report_url, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: this._preparePostParams({ "message" : message, "log_level": log_level, "stack_trace": stack_trace })
    }).then(function(response) {
      response.text().then((t) => self._print(`Reported \'${message}\` to ${this.http_report_url}, response was: ${t}`));
    });
  }

  _preparePostParams(params) {
    return Object.keys(params).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  _print(message) {
    if(!this.test_env)
      console.log(message);
  }

}
