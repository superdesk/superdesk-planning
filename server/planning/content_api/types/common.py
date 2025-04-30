from superdesk.core.resources import fields, Dataclass
from planning.types import EventResourceModel
from pydantic import Field


class MatchingProduct(Dataclass):
    code: fields.Keyword
    name: str
