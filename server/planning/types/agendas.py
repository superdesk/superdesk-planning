from typing import Annotated

from .base import BasePlanningModel
from superdesk.core.resources import fields
from superdesk.core.resources.validators import validate_iunique_value_async


class AgendasResourceModel(BasePlanningModel):
    name: Annotated[fields.Keyword, validate_iunique_value_async("agendas", "name")]
    is_enabled: bool = True
