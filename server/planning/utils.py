from typing import Union
from bson.objectid import ObjectId
from bson.errors import InvalidId


def try_cast_object_id(value: str) -> Union[ObjectId, str]:
    try:
        return ObjectId(value)
    except InvalidId:
        return value
