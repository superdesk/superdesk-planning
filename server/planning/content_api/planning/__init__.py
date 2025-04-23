from superdesk.core.module import Module
from .module import content_api_planning_resource_config

module = Module("planning.content_api.planning", resources=[content_api_planning_resource_config])
