from superdesk.core.module import Module
from .module import content_api_event_resource_config

module = Module("planning.content_api.events", resources=[content_api_event_resource_config])
