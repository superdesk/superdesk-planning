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

    new_event["subject"] = [{"qcode": "foo"}, {"qcode": "bar"}]
    old_event["subject"] = [{"qcode": "bar"}, {"qcode": "foo"}]

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

    new_event["subject"] = [{"qcode": "foo", "name": "foo", "translations": {"fr-CA": "Foo"}}]
    old_event["subject"] = [{"qcode": "foo", "name": "foo", "translations": None}]

    assert service.is_new_version(new_event, old_event)

    new_event["subject"] = [{"qcode": "foo", "name": "foo", "translations": {"fr-CA": "Bar"}}]
    old_event["subject"] = [{"qcode": "foo", "name": "foo", "translations": {"fr-CA": "Foo"}}]

    assert service.is_new_version(new_event, old_event)


def test_should_update():
    service = EventsService()
    new_event: Event = {"versioncreated": datetime.now()}
    old_event: Event = new_event.copy()

    assert service.should_update(old_event, new_event, provider={})

    # Test: should_update returns True when old_item is None
    assert service.should_update(None, new_event, provider={})

    # Test: should_update returns True when version_creator is None
    old_event = {"versioncreated": datetime.now(), "version_creator": None}
    assert service.should_update(old_event, new_event, provider={})

    # Test: should_update returns False when pubstatus is "cancelled"
    old_event = {
        "versioncreated": datetime.now(),
        "version_creator": "user_id",
        "pubstatus": "cancelled",
    }
    assert not service.should_update(old_event, new_event, provider={})
