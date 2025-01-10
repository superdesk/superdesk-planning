import {IAuthoringFieldV2} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

export const getContactsField = () => ({
    fieldId: 'event_contact_info',
    getField: ({id, required}) => {
        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Contacts'),
            fieldType: 'contact',
            fieldConfig: {
                required: required,
            },
        };

        return field;
    },
});
