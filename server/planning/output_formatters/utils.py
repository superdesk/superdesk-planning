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

    for contact in contacts:
        contact_details = get_resource_service('contacts').find_one(req=None, _id=contact)
        if contact_details:
            for f in remove_contact_fields:
                contact_details.pop(f, None)
            # Remove any none public contact details
            contact_details['contact_phone'] = [p for p in contact_details.get('contact_phone', []) if
                                                p.get('public')]
            contact_details['mobile'] = [p for p in contact_details.get('mobile', []) if p.get('public')]
            if contact_details.get('public', False) and contact_details.get('is_active', False):
                expanded.append(contact_details)
    return expanded
