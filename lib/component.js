import mixin from './utils/mixin.js'
import { Attributable } from './attributable.js'
import { Heritable    } from './heritable.js'
import { Subscriber   } from './observable_roles/subscriber.js'
import { Publisher    } from './observable_roles/publisher.js'

export class Component extends mixin(Attributable,Heritable,Subscriber,Publisher) {

  constructor() {
    super();
  }

}
