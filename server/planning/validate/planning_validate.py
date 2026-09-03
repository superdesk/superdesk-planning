import logging
from copy import deepcopy
from typing import Any

from apps.validate.validate import SchemaValidator as Validator
from superdesk.metadata.item import ITEM_TYPE
from planning.content_profiles.utils import get_enabled_fields
from planning.types import Event, PlanningProfileResource

logger = logging.getLogger(__name__)
REQUIRED_ERROR = "{} is a required field"


class SchemaValidator(Validator):
    def _validate_validate_on_post(self, validate, field, value):
        """
        {'type': 'boolean'}
        """

        # Ignore this profile as it's to control logic of client side input of Event date range
        pass

    def _validate_field_type(self, field_type, field, value):
        """
        {'type': 'string', 'nullable': True, 'required': False}
        """

        # Ignore this profile as it's for the front-end editor
        pass

    def _validate_expandable(self, expandable, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """

        # Ignore this profile as it's for the front-end editor
        pass

    def _validate_format_options(self, format_options, field, value):
        """
        {'type': 'list', 'nullable': True}
        """

        # Ignore this profile as it's for the front-end editor
        pass

    def _validate_read_only(self, read_only, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """

        # Ignore this profile as it's for the front-end editor
        pass

    def _validate_planning_auto_publish(self, planning_auto_publish, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """
        pass

    def _validate_cancel_plan_with_event(self, cancel_plan_with_event, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """
        pass

    def _validate_default_language(self, default_language, field, value):
        """
        {'type': string, 'nullable': True}
        """
        pass

    def _validate_languages(self, languages, field, value):
        """
        {'type': 'list', 'nullable': True}
        """
        pass

    def _validate_multilingual(self, multilingual, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """
        pass

    def _validate_vocabularies(self, vocabularies, field, value):
        """
        {'type': 'list', 'nullable': True}
        """
        pass

    def _validate_show_in_embedded_editor(self, show_in_embedded_editor, field, value):
        """
        {'type': 'boolean', 'nullable': True}
        """

        # Ignore this profile as it's for the front-end embedded editor
        pass


def get_validator_schema(schema) -> dict:
    """Get schema for given data that will work with validator.

    - if field is required without minlength set make sure it's not empty
    - if there are keys with None value - remove them

    :param schema
    """
    validator_schema = {key: val for key, val in schema.items() if val is not None}

    if validator_schema.get("required") and not validator_schema.get("minlength"):
        validator_schema.setdefault("empty", False)

    return validator_schema


def get_filtered_validator_schema(validator, validate_on_post: bool) -> dict:
    """
    Get schema for a given validator, excluding fields with None values,
    and only include fields that are in enabled_fields.
    When no editor configuration is present, all schema fields are considered enabled.
    """

    enabled_fields = get_enabled_fields(validator) if validator.get("editor") else None
    return {
        field: get_validator_schema(field_schema)
        for field, field_schema in validator["schema"].items()
        if (enabled_fields is None or field in enabled_fields)
        and field_schema
        and field_schema.get("validate_on_post", False) == validate_on_post
    }


async def get_validator(item: dict, item_type: str) -> Event | None:
    """Get validators from planning types service."""
    service = PlanningProfileResource.get_service()

    if item_type == "coverage" and item.get("profile"):
        profile = await service.find_by_id(item["profile"])
    else:
        profile = await service.find_one(type=item_type)

    return profile.to_dict() if profile else None


async def validate_doc(item: dict, item_type: str, validate_on_post: bool = False) -> list:
    validator = await get_validator(item, item_type)

    if validator is None:
        logger.warn("Validator was not found for type:{}".format(item_type))
        return []

    validation_schema = get_filtered_validator_schema(validator, validate_on_post)

    v = SchemaValidator()
    v.allow_unknown = True

    try:
        v.validate(item, validation_schema)
    except TypeError as e:
        logger.exception('Invalid validator schema value "%s" for ' % str(e))

    error_list = v.errors
    response = []
    for field in error_list:
        error = error_list[field]

        # If error is a list, only return the first error
        if isinstance(error, list):
            error = error[0]

        if error == "empty values not allowed" or error == "required field":
            response.append(REQUIRED_ERROR.format(field.upper()))
        else:
            response.append("{} {}".format(field.upper(), error))

    return response


async def validate_docs(docs: list[dict[str, Any]]) -> list:
    """
    Validate a list of documents asynchronously and returns a list of
    validation errors
    """
    for doc in docs:
        test_doc = deepcopy(doc)
        doc["errors"] = await validate_doc(
            test_doc["validate"], test_doc[ITEM_TYPE], test_doc.get("validate_on_post", False)
        )

    return [doc["errors"] for doc in docs]
