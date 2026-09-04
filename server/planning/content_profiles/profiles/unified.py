import superdesk.schema as schema

from .fields import (
    BaseSchema,
    subjectField,
    BooleanField,
    TextField,
    StringField,
    LanguageField,
    DateOptionalTimeField,
)


class UnifiedPlanningSchema(BaseSchema):
    """
    The base unified planning schema used to validate the Events & Planning form
    """

    agendas = schema.ListField()
    anpa_category = schema.ListField()
    ednote = TextField(field_type="multi_line")
    files = schema.ListField()
    marked_for_not_publication = BooleanField()
    overide_auto_assign_to_workflow = BooleanField()
    headline = StringField()
    internal_note = TextField(field_type="multi_line", expandable=True)
    language = LanguageField()
    name = TextField(required=True, field_type="single_line")
    place = schema.ListField()
    slugline = StringField()
    subject = subjectField
    urgency = schema.IntegerField()
    priority = schema.IntegerField()
    coverages = schema.ListField()
    location = schema.ListField()

    definition_long = TextField(field_type="multi_line")
    definition_short = TextField(field_type="multi_line")
    event_contact_info = schema.ListField()
    links = schema.ListField()
    reference = StringField()
    related_items = schema.ListField()
    calendars = schema.ListField()
    registration_details = TextField(field_type="multi_line")
    invitation_details = TextField(field_type="multi_line")
    accreditation_info = TextField(field_type="single_line")
    accreditation_deadline = DateOptionalTimeField()
