from .common import set_original_creator
from apps.auth import get_user_id
from superdesk import Resource, Service, config, get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification


class AgendasResource(Resource):
    url = 'agenda'
    schema = {
        'name': {
            'type': 'string',
            'iunique': True,
            'required': True,
            'empty': False,
            'nullable': False
        },
        # Audit Information
        'original_creator': Resource.rel('users'),
        'version_creator': Resource.rel('users'),
        'is_enabled': {
            'type': 'boolean',
            'default': True
        },
    }

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'DELETE']

    privileges = {
        'POST': 'planning_agenda_management',
        'PATCH': 'planning_agenda_management',
        'DELETE': 'planning_agenda_management'
    }


class AgendasService(Service):
    def _generate_planning_info(self, docs):
        planning_service = get_resource_service('planning')
        for doc in docs:
            doc['plannings'] = planning_service.get_planning_by_agenda_id(doc.get(config.ID_FIELD)).docs

    def on_fetched(self, docs):
        self._generate_planning_info(docs.get(config.ITEMS))

    def on_fetched_item(self, doc):
        self._generate_planning_info([doc])

    def on_create(self, docs):
        for doc in docs:
            set_original_creator(doc)

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'agenda:created',
                item=str(doc[config.ID_FIELD]),
                user=str(doc.get('original_creator', ''))
            )

    def on_update(self, updates, original):
        user_id = get_user_id()
        if user_id:
            updates['version_creator'] = get_user_id()

    def on_updated(self, updates, original):
        self._generate_planning_info([updates])
        push_notification(
            'agenda:updated',
            item=str(original[config.ID_FIELD]),
            user=str(updates.get('version_creator', ''))
        )

    def on_delete(self, doc):
        if get_resource_service('planning').get_planning_by_agenda_id(doc.get(config.ID_FIELD)).count() > 0:
            raise SuperdeskApiError.badRequestError(message='Agenda is referenced by Planning items. '
                                                            'Cannot delete Agenda')

    def on_deleted(self, doc):
        push_notification(
            'agenda:deleted',
            item=str(doc[config.ID_FIELD])
        )
