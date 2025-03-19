import {IAuthoringFieldV2} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

export const getContactsField = (): IFieldDefinition => ({
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
