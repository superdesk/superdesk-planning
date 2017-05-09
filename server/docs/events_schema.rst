Events Schema
===========

.. automodule:: planning.events

Superdesk uses internally item schema that is an extension of ninjs,
so on ingest everything is converted to this schema, and on publishing
it's converted to different formats.

See IPTC-G2-Implementation_Guide (version 2.21) Section 15.4 for further information about the Events Schema.

Identifiers
-----------

``guid`` *string*

    Globally unique id. Using external id for ingested content.

``unique_id`` *integer*

    Internally unique id.

``unique_name`` *string*
    
    Internally unique name. By default same as ``unique_id``.

``version`` *integer*

    Set by client - used to create items with version ``0`` which are used as drafts.

``ingest_id`` *string*

    Ingest item id from which item was fetched.

``recurrence_id`` *string*

    Internal id for recurrence events.  All recurrence events for a particular recurring event will share this id.

Audit Information
-------------------

``original_creator`` *id*

    User who created/fetched item.

``version_creator`` *id*

    User who created current version.

``firstcreated`` *datetime*

    When the item was created.

``versioncreated`` *datetime*

    When current version was created.

Ingest Details
---------------

``ingest_provider`` *id*

    Ingest provider id.

``source`` *string*

    Ingest provider source value. Using ``DEFAULT_SOURCE_VALUE_FOR_MANUAL_ARTICLES`` config for
    items created locally.

``original_source`` *string*

    Source value from ingested item.

``ingest_provider_sequence`` *integer*

    Counter for ingest items.

Event Details
--------------

``name`` *string*

    Name or title of the event.

``description_short`` *string*

    Text for short description.

``description_long`` *string*

    Text for long description.

``anpa_category`` *list*

    Optional, repeatable. The category classification(s) of the event.

``files`` *list*

    Optional, repeatable. Files attached to the event.

``relationships`` *dict*

    Details for relationships dict::

        'relationships': {
            'broader': 'string',
            'narrower': 'string',
            'related': 'string',
        }

``links`` *list*

    Optional, repeatable. Links attached to the event.

``dates`` *dict*
    
   Details of dates dict::

        'date': {
            'start': 'dateimte',
            'end': 'dateimte',
            'duration': 'string',
            'confirmation': 'string',
            'recurring_date': [ 'datetime' ],
            'recurring_rule': {
                'frequency': 'string',
                'interval': 'string',
                'until': 'string',
                'count': 'string',
                'bymonth': 'string',
                'byday': 'string',
                'byhour': 'string',
                'byminute': 'string'
            },
            'occur_status': 'dict',
            'ex_date': [ 'datetime' ],
            'ex_rule': {
                'frequency': 'string',
                'interval': 'string',
                'until': 'string',
                'count': 'string',
                'bymonth': 'string',
                'byday': 'string',
                'byhour': 'string',
                'byminute': 'string'
            }
        }

``occur_status`` *dict*

    Optional, non-repeatable property to indicate the provider’s confidence that the event will occur.

``news_coverage_status`` *dict*

    Optional, non-repeatable element to indicate the status of planned news coverage of the event by the provider, using a QCODE and optional Name.

``registration`` *string*

    Optional, repeatable indicator of any registration details required for the event.

``access_status`` *list*

    Optional, repeatable property indicating the accessibility, the ease (or otherwise) of gaining physical access to the event, for example, whether easy, restricted, difficult.

``subject`` *list*

    Optional, repeatable. The subject classification(s) of the event.

``location`` *list*

    Repeatable property indicating the location of the event with an optionali Name.

``participant`` *list*

    Optional, repeatable, The people and/or organisations taking part in the event.   

``participant_requirement`` *list*

    Optional, repeatable element for expressing any required conditions for participation in, or attendance at, the event, expressed by a URI or QCode.

``organiser`` *list*

    Optional, repeatable. Describes the organiser of the event.

``event_contact_info`` *list*

    Indicates how to get in contact with the event. This may be a web site, or a temporary office established for the event, not necessarily the organiser or any participant.

``event_language`` *list*

    Optional, repeatable element describes the language(s) associated with the event.
