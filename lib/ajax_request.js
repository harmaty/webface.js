import { castMapValues } from '../utils/map_utils.js'

var AjaxRequest = {

  "make": function(url, { type="GET", params=null, display_40x=true, on_error=null }={}) {

    print("${type} ajax request to ${url} ${params}");

    let headers = {};
    headers["Accept"] = "application/json";
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = document.body.attributes["data-authenticity-token"];

    var completer = new Completer();

    HttpRequest.request(url, method: type, requestHeaders: headers, sendData: JSON.encode(params)).then((r) {
      var result = castMapValues(JSON.decode(r.responseText));
      completer.complete(result);
    }).catchError((r) {
      print("AJAX request result: ${r.target.status}, ${display_40x}");
      if (r.target.status == 401)
        window.location.href = "/accounts/sign_in";
      else if (r.target.status == 403 || r.target.status == 404) {
        if(display_40x)
          FrontendNotifierComponent.instance.display(I18N.t("ajax_errors.${r.target.status}"), "error", close_in: 10);
      } else {
        var result = castMapValues(JSON.decode(r.target.responseText));
        var message = I18N.t("ajax_errors.${r.target.status}");
        if(result["error"] != null)
          message = result["error"];
        FrontendNotifierComponent.instance.display(message, "error", close_in: 10);
      }

      if (on_error == #raise)
        completer.completeError(new Exception("Failed to reach $type $url, returned status ${r.target.status}\n\nResponse was:\n${r.target.responseText}\n"));
      else if(on_error != null)
        on_error();
    });

    return completer.future;

  }

}
