
from flask import abort
from eve.utils import config

from superdesk import get_resource_service, logger
from superdesk.resource import Resource, not_analyzed
from superdesk.notification import push_notification

from .events import EventsResource
from .events_base_service import EventsBaseService
from planning.common import WORKFLOW_STATE, POST_STATE, post_state, UPDATE_SINGLE,\
    UPDATE_METHODS, UPDATE_FUTURE, get_item_post_state, enqueue_planning_item, get_version_item_for_post


class EventsPostResource(EventsResource):
    schema = {
        'event': Resource.rel('events', type='string', required=True),
        'etag': {'type': 'string', 'required': True},
        'pubstatus': {'type': 'string', 'required': True, 'allowed': post_state},

        # The update method used for recurring events
        'update_method': {
            'type': 'string',
            'allowed': UPDATE_METHODS,
            'mapping': not_analyzed,
            'nullable': True
        },
        # used to only repost an item when data changes from backend (update_repetitions)
        'repost_on_update': {'type': 'boolean', 'required': False, 'default': False},
    }

    url = 'events/post'
    resource_title = endpoint_name = 'events_post'
    resource_methods = ['POST']
    privileges = {'POST': 'planning_event_post'}
    item_methods = []


class EventsPostService(EventsBaseService):
    def create(self, docs):
        ids = []
        events_service = get_resource_service('events')
        for doc in docs:
            event = events_service.find_one(req=None, _id=doc['event'])

            if not event:
                abort(412)

            update_method = self.get_update_method(event, doc)

            if update_method == UPDATE_SINGLE:
                ids.extend(
                    self._post_single_event(doc, event)
                )
            else:
                ids.extend(
                    self._post_recurring_events(doc, event, update_method)
                )
        return ids

    @staticmethod
    def validate_post_state(new_post_state):
        try:
            assert new_post_state in post_state
        except AssertionError:
            abort(409)

    @staticmethod
    def validate_item(doc):
        errors = get_resource_service('planning_validator').post([{
            'validate_on_post': True,
            'type': 'event',
            'validate': doc
        }])[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    def _post_single_event(self, doc, event):
        self.validate_post_state(doc['pubstatus'])
        self.validate_item(event)
        updated_event = self.post_event(event, doc['pubstatus'], doc.get('repost_on_update'))

        event_type = 'events:posted' if doc['pubstatus'] == POST_STATE.USABLE else 'events:unposted'
        push_notification(
            event_type,
            item=event[config.ID_FIELD],
            etag=updated_event['_etag'],
            pubstatus=updated_event['pubstatus'],
            state=updated_event['state']
        )

        return [doc['event']]

    def _post_recurring_events(self, doc, original, update_method):
        post_to_state = doc['pubstatus']
        historic, past, future = self.get_recurring_timeline(original,
                                                             cancelled=True if post_to_state == POST_STATE.CANCELLED
                                                             else False)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            posted_events = [original] + future
        else:
            posted_events = historic + past + [original] + future

        # First we want to validate that all events can be posted
        for event in posted_events:
            self.validate_post_state(post_to_state)
            self.validate_item(event)

        # Next we perform the actual post
        updated_event = None
        ids = []
        items = []
        for event in posted_events:
            updated_event = self.post_event(event, post_to_state, doc.get('repost_on_update'))
            ids.append(event[config.ID_FIELD])
            items.append({
                'id': event[config.ID_FIELD],
                'etag': updated_event['_etag']
            })

        # Do not send push-notification if reposting as each event's post state is different
        # The original action's notifications should refetch items
        if not doc.get('repost_on_update'):
            event_type = 'events:posted:recurring' if doc['pubstatus'] == POST_STATE.USABLE \
                else 'events:unposted:recurring'

            push_notification(
                event_type,
                item=original[config.ID_FIELD],
                items=items,
                recurrence_id=str(original.get('recurrence_id')),
                pubstatus=updated_event['pubstatus'],
                state=updated_event['state']
            )

        return ids

    def post_event(self, event, new_post_state, repost):
        # update the event with new state
        if repost:
            # same pubstatus or scheduled (for draft events)
            new_post_state = event.get('pubstatus', POST_STATE.USABLE)

        new_item_state = get_item_post_state(event, new_post_state, repost)
        updates = {'state': new_item_state, 'pubstatus': new_post_state}
        event['pubstatus'] = new_post_state
        # Remove previous workflow state reason
        if new_item_state in [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.KILLED]:
            updates['state_reason'] = None
            if not event.get('completed'):
                updates['actioned_date'] = None

        updated_event = get_resource_service('events').update(event['_id'], updates, event)
        event.update(updated_event)

        # enqueue the event
        # these fields are set for enqueue process to work. otherwise not needed
        version, event = get_version_item_for_post(event)
        # save the version into the history
        updates['version'] = version

        get_resource_service('events_history')._save_history(event, updates, 'post')
        plannings = list(get_resource_service('events').get_plannings_for_event(event))

        event['plans'] = [p.get('_id') for p in plannings]
        self.publish_event(event, version)

        if len(plannings) > 0:
            self.post_related_plannings(plannings, new_post_state)

        return updated_event

    def publish_event(self, event, version):
        """Enqueue the items for publish"""
        version_id = get_resource_service('published_planning').post([{'item_id': event['_id'],
                                                                       'version': version,
                                                                       'type': 'event',
                                                                       'published_item': event}])
        if version_id:
            # Asynchronously enqueue the item for publishing.
            enqueue_planning_item.apply_async(kwargs={'id': version_id[0]}, serializer="eve/json")
        else:
            logger.error('Failed to save planning version for event item id {}'.format(event['_id']))

    def post_related_plannings(self, plannings, new_post_state):
        # Check to see if we are un-posting, we need to unpost it's planning item
        if new_post_state != POST_STATE.CANCELLED:
            return

        planning_post_service = get_resource_service('planning_post')
        planning_spike_service = get_resource_service('planning_spike')
        docs = []
        for planning in plannings:
            if not planning.get('pubstatus') and planning.get('state') in\
                    [WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.POSTPONED, WORKFLOW_STATE.CANCELLED]:
                planning_spike_service.patch(planning.get(config.ID_FIELD), planning)
            elif planning.get('pubstatus') != POST_STATE.CANCELLED:
                docs.append({
                    'planning': planning.get(config.ID_FIELD),
                    'etag': planning.get('etag'),
                    'pubstatus': POST_STATE.CANCELLED
                })

        # unpost all required planning items
        if len(docs) > 0:
            planning_post_service.post(docs)

    @staticmethod
    def _get_post_state(event, new_post_state):
        if new_post_state == POST_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if event.get('pubstatus') != POST_STATE.USABLE:
            # Publishing for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return event.get('state')
