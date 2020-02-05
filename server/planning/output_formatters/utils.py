from superdesk import get_resource_service


def expand_contact_info(contacts):
    """
    Given an item it will scan any event contacts, look them up and return the expanded values

    :param item:
    :return: Array of expanded contacts
    """
    remove_contact_fields = {'_etag', '_type'}
    expanded = []
    if not contacts:
        return expanded

    contact_details = get_resource_service('contacts').find(where={
        '_id': {'$in': contacts},
        'public': True,
        'is_active': True
    })

    if contact_details.count():
        for c_details in contact_details:
            for f in remove_contact_fields:
                c_details.pop(f, None)
            # Remove any none public contact details
            c_details['contact_phone'] = [p for p in c_details.get('contact_phone', [])]
            c_details['mobile'] = [p for p in c_details.get('mobile', [])]
            expanded.append(c_details)
    return expanded
