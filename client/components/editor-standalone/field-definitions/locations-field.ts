import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

interface ILocationFieldConfig extends ICommonFieldConfig {
    storeAsArray: boolean;
}

export const getLocationsField = (): IFieldDefinition => ({
    fieldId: 'location',
    getField: ({id, required}) => {
        const fieldConfig: ILocationFieldConfig = {
            required: required,
            storeAsArray: true,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Location'),
            fieldType: 'location',
            fieldConfig: fieldConfig,
        };

        return field;
    },
});
