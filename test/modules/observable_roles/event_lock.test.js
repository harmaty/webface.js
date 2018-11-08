import { extend_as } from '../../lib/utils/mixin.js'
import { EventLock } from '../../lib/modules/observable_roles/event_lock.js'

class EventLockDummy extends extend_as("EventLockDummy").mixins(EventLock) {}

describe('observable_roles', function() {

  describe('EventLock', function() {

    var dummy;

    beforeEach(function() {
      dummy = new EventLockDummy();
      dummy.event_lock_for = ["click", "submit.click"];
    });

    it("adds an event lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      dummy.addEventLock("mouseover");
      dummy.addEventLock("mouseover", { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
      chai.expect(dummy.event_locks).to.not.include("mouseover");
      chai.expect(dummy.event_locks).to.not.include("submit.mouseover");
    });

    it("removes an event lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
      dummy.removeEventLock("click");
      dummy.removeEventLock("click", { publisher_roles: "submit1" });
      chai.expect(dummy.event_locks).to.not.include("click");
      chai.expect(dummy.event_locks).to.include("submit.click");
    });

    it("checks if event has a lock", function() {
      dummy.addEventLock("click");
      dummy.addEventLock("click2");
      dummy.addEventLock("click", { publisher_roles: "submit" });
      chai.expect(dummy.hasEventLock("click")).to.be.true;
      chai.expect(dummy.hasEventLock("submit.click")).to.be.true;
      chai.expect(dummy.hasEventLock("click2")).to.be.false;
    });

    it("allows for arrays to be used in event_lock_for", function() {
      dummy.event_lock_for = [["click", "touchend"]];
      dummy.addEventLock("click");
      dummy.addEventLock("touchend");
      dummy.addEventLock("mouseover");
      chai.expect(dummy.event_locks).to.include("click");
      chai.expect(dummy.event_locks).to.include("touchend");
      chai.expect(dummy.event_locks).to.not.include("mouseover");
    });

  });

});
