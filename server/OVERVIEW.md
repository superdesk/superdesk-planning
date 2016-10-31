# Superdesk Planning API Overview

This component implements news event and planning features into the Superdesk ecosystem.  The implementation is based on the IPTC EventsML-G2, a subset of NewsML-G2, standards (https://www.iptc.org/std/NewsML-G2/2.21/documentation/NewsML-G2-Implementation_Guide_8.0.pdf).  This component adds following API endpoints to a Superdesk instance.

## Events
**api/events**

Events are newsworthy happenings that may result in the creation of journalistic content.  This endpoint is used to manage details about events including What, Where, When, and Who.

See NewsML-G2-Implementation_Guide Section 15.2


## Planning
**api/planning**

Planning items link events to coverage sets.  Here we can also define some default metadata to be applied to all coverage associated with the planning item.

See NewsML-G2-Implementation_Guide Section 16

## Coverage
**api/coverage**

Coverage items contain details about what kind of coverage is desired for a specific event.  This includes general overall descriptions as well as detailed item and content metadata, such as specific media types or default subject or category codes.  Typically, each coverage item is bound to a specific TYPE of item to be delivered.  Additionally coverage items also contain a delivery section which maintains a references to any content created for a coverage.

See NewsML-G2-Implementation_Guide Section 16.4

## Locations
**api/locations**

Locations describe more detailed information about an events "Where".  These are broken out into their own resource in order to share common locations.
 
See NewsML-G2-Implementation_Guide Section 12.6.3
