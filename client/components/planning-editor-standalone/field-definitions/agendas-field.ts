import {IAgenda} from '../../../interfaces';
import {IDropdownConfigManualSource, IAuthoringFieldV2} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

export const getAgendasField = (): IFieldDefinition => ({
    fieldId: 'agendas',
    getField: ({id, required}) => {
        const {gettext} = superdeskApi.localization;

        const fieldConfig: IDropdownConfigManualSource = {
            source: 'manual-entry',
            options: ((planningApi.redux.store.getState().agenda.agendas ?? []) as Array<IAgenda>)
                .filter((item) => item.is_enabled)
                .map((item) => ({
                    id: item._id,
                    label: item.name,
                })),
            roundCorners: true,
            type: 'text',
            multiple: true,
            required: required,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: gettext('Agendas'),
            fieldType: 'dropdown',
            fieldConfig: fieldConfig,
        };

        return field;
    },
});
