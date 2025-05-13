from typing import Annotated
from superdesk.core.resources import fields, Dataclass
from superdesk.core.resources.validators import validate_data_relation_async


class MatchingProduct(Dataclass):
    code: Annotated[fields.ObjectId, validate_data_relation_async("products")]
    name: str
