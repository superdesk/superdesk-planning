from datetime import datetime, timedelta

from planning.events.events import EventsService
from planning.types import Event


def test_is_new_version():
    service = EventsService()

    new_event: Event = {"versioncreated": datetime.now()}
    old_event: Event = {"versioncreated": datetime.now() - timedelta(days=1)}

    assert service.is_new_version(new_event, old_event)

    new_event = {"versioncreated": datetime.now()}
    old_event = new_event.copy()

    assert not service.is_new_version(new_event, old_event)

    new_event["subject"] = [{"qcode": "foo"}]
    old_event["subject"] = [{"qcode": "bar"}]

    assert service.is_new_version(new_event, old_event)

    new_event["subject"] = [{"qcode": "foo", "name": "Foo"}]
    old_event["subject"] = [{"qcode": "foo", "name": "foo"}]

    assert service.is_new_version(new_event, old_event)

    new_event["subject"] = [{}]
    old_event["subject"] = [{"qcode": "foo", "name": "foo"}]

    assert service.is_new_version(new_event, old_event)


def test_should_update():
    service = EventsService()
    new_event: Event = {"versioncreated": datetime.now()}
    old_event: Event = new_event.copy()

    assert service.should_update(old_event, new_event, provider={})
