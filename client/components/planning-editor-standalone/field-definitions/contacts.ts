import {IAuthoringFieldV2} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

export function getContactsField() {
    return {
        fieldId: 'contact',
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
    };
}
