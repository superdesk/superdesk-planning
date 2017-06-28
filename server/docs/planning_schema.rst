Planning Schema
===========

.. automodule:: planning.planning

Superdesk uses internally item schema that is an extension of ninjs,
so on ingest everything is converted to this schema, and on publishing
it's converted to different formats.

See IPTC-G2-Implementation_Guide (version 2.21) Section 16 for further information about the Planning Schema.

This collection is storage for individual planning items as well as agendas.  The `planning_type` field is used to deteremine the type.

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

``ingest_provider`` *id*

    Ingest provider id.

``source`` *string*

    Ingest provider source value. Using ``DEFAULT_SOURCE_VALUE_FOR_MANUAL_ARTICLES`` config for
    items created locally.

``original_source`` *string*

    Source value from ingested item.

``ingest_provider_sequence`` *integer*

    Counter for ingest items.

Agenda Item Details
-------------

``planning_type`` *string*

  Text description of the type of planning.  Can be null (event), or 'agenda'.

``name`` *string*

  Name for the agenda.

``planning_items`` *list*

  List of child planning ids.  

Event Item
-----------

``event_item`` *string*

  Internal id of the associated event.  

Planning Item Metadata
--------------

``ìtem_class``

   News codes for the items associated with the planning. 

``ednote`` *string*

    Editorial comment.

``description_text`` *string*

    Text description of the item. Used for media types.

``anpa_category`` *list*

    Values from category cv.

``subject`` *list*

    Values from `IPTC subjectcodes <https://iptc.org/standards/newscodes/>`_ plus from custom cvs.

``genre`` *list*

    Values from genre cv.

``company_codes`` *list*

    Values from company codes cv.

Content Metadata
------------------

``language`` *string*

    Item language code.

``abstract`` *string*

    Perex or lead.

``headline`` *string*

    Item headline.

``slugline`` *string*

    Item slugline.

``keywords`` *list*

    List of keywords.

``word_count`` *integer*

    Word count in ``body_html`` field.

``priority`` *integer*

    Item priority.

``urgency`` *integer*

    Item urgency.

``profile`` *string*

    Content profile id.

