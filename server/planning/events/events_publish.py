
from flask import abort
from eve.utils import config

from superdesk import get_resource_service
from superdesk.resource import Resource, not_analyzed
from apps.publish.enqueue import get_enqueue_service
from superdesk.notification import push_notification

from .events import EventsResource
from .events_base_service import EventsBaseService
from planning.common import WORKFLOW_STATE, PUBLISHED_STATE, published_state,\
    UPDATE_SINGLE, UPDATE_METHODS, UPDATE_FUTURE, get_item_publish_state


class EventsPublishResource(EventsResource):
    schema = {
        'event': Resource.rel('events', type='string', required=True),
        'etag': {'type': 'string', 'required': True},
        'pubstatus': {'type': 'string', 'required': True, 'allowed': published_state},

        # The update method used for recurring events
        'update_method': {
            'type': 'string',
            'allowed': UPDATE_METHODS,
            'mapping': not_analyzed,
            'nullable': True
        },
    }

    url = 'events/publish'
    resource_title = endpoint_name = 'events_publish'
    resource_methods = ['POST']
    privileges = {'POST': 'planning_event_publish'}
    item_methods = []


class EventsPublishService(EventsBaseService):
    def create(self, docs):
        ids = []
        for doc in docs:
            event = get_resource_service('events').find_one(req=None, _id=doc['event'], _etag=doc['etag'])

            if not event:
                abort(412)

            update_method = self.get_update_method(event, doc)

            if update_method == UPDATE_SINGLE:
                ids.extend(
                    self._publish_single_event(doc, event)
                )
            else:
                ids.extend(
                    self._publish_recurring_events(doc, event, update_method)
                )
        return ids

    @staticmethod
    def validate_published_state(new_published_state):
        try:
            assert new_published_state in published_state
        except AssertionError:
            abort(409)

    @staticmethod
    def validate_item(doc):
        errors = get_resource_service('planning_validator').post([{
            'validate_on_publish': True,
            'type': 'event',
            'validate': doc
        }])[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    def _publish_single_event(self, doc, event):
        self.validate_published_state(doc['pubstatus'])
        self.validate_item(event)
        updated_event = self.publish_event(event, doc['pubstatus'])

        event_type = 'events:published' if doc['pubstatus'] == PUBLISHED_STATE.USABLE else 'events:unpublished'
        push_notification(
            event_type,
            item=event[config.ID_FIELD],
            etag=updated_event['_etag'],
            pubstatus=updated_event['pubstatus'],
            state=updated_event['state']
        )

        return [doc['event']]

    def _publish_recurring_events(self, doc, original, update_method):
        historic, past, future = self.get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            published_events = [original] + future
        else:
            published_events = historic + past + [original] + future

        # First we want to validate that all events can be published
        for event in published_events:
            self.validate_published_state(doc['pubstatus'])
            self.validate_item(event)

        # Next we perform the actual publish
        updated_event = None
        ids = []
        items = []
        for event in published_events:
            updated_event = self.publish_event(event, doc['pubstatus'])
            ids.append(event[config.ID_FIELD])
            items.append({
                'id': event[config.ID_FIELD],
                'etag': updated_event['_etag']
            })

        event_type = 'events:published:recurring' if doc['pubstatus'] == PUBLISHED_STATE.USABLE \
            else 'events:unpublished:recurring'

        push_notification(
            event_type,
            item=original[config.ID_FIELD],
            items=items,
            pubstatus=updated_event['pubstatus'],
            state=updated_event['state']
        )

        return ids

    def publish_event(self, event, new_publish_state):
        event.setdefault(config.VERSION, 1)
        event.setdefault('item_id', event['_id'])
        get_enqueue_service('publish').enqueue_item(event, 'event')
        updates = {'state': get_item_publish_state(event, new_publish_state), 'pubstatus': new_publish_state}
        event['pubstatus'] = new_publish_state
        updated_event = get_resource_service('events').update(event['_id'], updates, event)
        get_resource_service('events_history')._save_history(event, updates, 'publish')
        return updated_event

    @staticmethod
    def _get_publish_state(event, new_publish_state):
        if new_publish_state == PUBLISHED_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if event.get('pubstatus') != PUBLISHED_STATE.USABLE:
            # Publishing for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return event.get('state')
