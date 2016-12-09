Coverage Schema
===========

.. automodule:: planning.coverage

Superdesk uses internally item schema that is an extension of ninjs,
so on ingest everything is converted to this schema, and on publishing
it's converted to different formats.

See IPTC-G2-Implementation_Guide (version 2.21) Section 16.4 for further information about the Coverage Schema.

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

Planning Item
--------------

``planning_item``

  Internal id of the associated planning item.

Planning Metadata Hints
------------------------

``planning.ednote`` *string*

    Editorial comment.

``planning.g2_content_type``

   Optional, non-repeatable element to indicate the MIME type of the intended coverage.

``planning.item_class`` *string*

   Optional, non-repeatable element indicates the type of content to be delivered, using the IPTC News Item Nature NewsCodes. 

``planning.item_count`` *string*

    The number of items to be delivered, expressed as a range (ex: 1-5)

``planning.scheduled`` *dateimte*

    Optional, non-repeatable. Indicates the scheduled time of delivery, and may be truncated if the precise date and time is not known.

``planning.service`` *list*

    Optional, repeatable. The editorial service to which the content has been assigned by the provider and on which the receiver should expect to receive the planned content.

``planning.assigned_to`` *string*

    Optional, non-repeatable element that holds the details of a person or organisation who has been assigned to create the announced content.

``planning.news_content_characteristics`` *list*

    Optional, repeatable,enables providers to express physical properties of the planned item using attributes from the News Content Characteristics group.

``planning.planning_ext_property`` *list*

    For example, the planned item has a proprietary content rating. The rating is expressed using a QCode indicating the nature of the proprietary property, an optional name, and a value.

``planning.by`` *list*

    Optional, repeatable. Natural language author/creator information.

``planning.credit_line`` *list*

    Optional, repeatable. A freeform expression of the credit(s) for the content.

``planning.dateline`` *list*

    Optional, repeatable. Natural language information traditionally placed at the start of a text by some news agencies, indicating the place and time that the content was created.

``planning.description`` *list*

    Text description of the item. Used for media types.

``planning.genre`` *list*

    Values from genre cv.

``planning.headline`` *string*

    Item headline.

``planning.keywords`` *list*

    List of keywords.

``planning.language`` *string*

    Item language code.

``planning.slugline`` *string*

    Item slugline.

``planning.subject`` *list*

    Values from `IPTC subjectcodes <https://iptc.org/standards/newscodes/>`_ plus from custom cvs.

Delivery Metadata
------------------

``delivery`` *dict*

    Optional, repeatable, tells the receiver which parts of the planned coverage has been delivered::

        'delivery': [
            {
                'rel': 'string',
                'href': 'string',
                'residref': 'string',
                'version': 'string',
                'content_type': 'string',
                'format': 'string',
                'size': 'string',
                'persistent_id_ref': 'string',
                'valid_from': 'datetime',
                'valid_to': 'datetime',
                'creator': 'string',
                'modified': 'datetime',
                'xml_lang': 'string',
                'dir': 'string',
                'rank': 'integer'
            }
        ]
