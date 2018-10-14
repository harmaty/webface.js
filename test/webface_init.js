import { Logmaster } from '../lib/logmaster.js'

window.webface = {
  "component_classes" : {},
  "logger"            : new Logmaster({test_env: true})
};

window.webface.logmaster_print_spy = chai.spy.on(window.webface.logger, "_print");
