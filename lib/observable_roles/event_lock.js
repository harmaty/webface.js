/** Event locks allow you to prevent similar events being handled twice
  * until the lock is removed. This is useful, for example, to prevent
  * button being clicked twice and, consequently, a form being submitted twice.
  */
export class EventLock {

  constructor() {
    /// Defines which events to use locks for
    this.event_lock_for = new Set();
    /// Stores the locks themselves. If event name is in this List, it's locked.
    this.event_locks    = new Set();
  }

  /** Adds a new event lock. In case the event name is not on the event_lock_for List,
      the lock wouldn't be set. If you want the lock to be set anyway,
      just use the event_locks property directly.
   */
  addEventLock(event_name, { publisher_roles=null }={}) {
    var event_names = this._prepareFullEventNames(event_name, { publisher_roles: publisher_roles });
    event_names.forEach(function(en) {
      if(this.event_lock_for.has(en))
        this.event_locks.add(en);
    }, this);
  }

  removeEventLock(event_name, { publisher_roles=null }={}) {
    var event_names = this._prepareFullEventNames(event_name, { publisher_roles: publisher_roles });
    event_names.forEach((en) => this.event_locks.delete(en), this);
  }

  hasEventLock(event_name) {
    return this.event_locks.has(event_name);
  }

  _prepareFullEventNames(event_name, { publisher_roles=null }={}) {
    var event_names = new Set();
    if(publisher_roles == null) {
      event_names.add(event_name);
    } else {
      if(typeof publisher_roles == 'string')
        publisher_roles = [publisher_roles];
      publisher_roles.forEach(function(r) {
        if(r == "#self")
          event_names.add(event_name);
        else
          event_names.add(`${r}.${event_name}`);
      });
    }
    return event_names;
  }

}
