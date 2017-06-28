Locations Schema
===========

.. automodule:: planning.locations

Superdesk uses internally item schema that is an extension of ninjs,
so on ingest everything is converted to this schema, and on publishing
it's converted to different formats.

See IPTC-G2-Implementation_Guide (version 2.21) Section 12.6.3 for further information about the Locations Schema.

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

Location Details
--------------

``name`` *string*

    Plain text name for the location.

``position`` *dict*

    Details for position dict::

        'position': {
            'latitude': 'float',
            'longitude': 'float',
            'altitude': 'integer',
            'gps_datum': 'string'
        }

``address`` *dict*
    
   Details of address dict::

        'address': {
            'line': [ 'string' ],
            'locality': 'string',
            'area': 'string',
            'country': 'string',
            'postal_code': 'string',
            'external': 'dict'
        }

``access`` *list*

    Optional, repeatable element to indicate Methods of accessing the POI, including directions.

``details`` *list*

    Optional, repeatable indicatoled information about the location.

``created`` *dateimte*

    Optional, the date (and optionally a time) on which the physical location was created (not the location item).

``ceased_to_exist`` *datetime*

    Optional, the date (and optionally a time) on which the physical location ceased to exist.

``open_hours`` *string*

    Optional, the operational hours of the location.

``capacity`` *string*

    Optional, location capacity.

``contact_info`` *list*

    Optional, repeatable.  Indicates how to get in contact with the location. This may be a web site, email, phone or any other human readable contact information.

