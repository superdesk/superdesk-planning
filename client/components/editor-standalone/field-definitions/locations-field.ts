import {IAuthoringFieldV2} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

export const getLocationsField = () => ({
    fieldId: 'location',
    getField: ({id, required}) => {
        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Location'),
            fieldType: 'location',
            fieldConfig: {
                required: required,
            },
        };

        return field;
    },
});
