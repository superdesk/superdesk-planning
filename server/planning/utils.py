from bson.objectid import ObjectId
from bson.errors import InvalidId


def try_cast_object_id(value):
    try:
        return ObjectId(value)
    except InvalidId:
        return value
