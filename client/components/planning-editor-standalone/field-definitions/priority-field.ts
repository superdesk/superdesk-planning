import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {superdeskApi} from '../../../superdeskApi';

export const getPriorityField = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'priority',
        getField: ({id, required}) => {
            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: [
                    {
                        id: '1',
                        label: gettext('1'),
                    },
                    {
                        id: '2',
                        label: gettext('2'),
                    },
                    {
                        id: '3',
                        label: gettext('3'),
                    },
                    {
                        id: '4',
                        label: gettext('4'),
                    },
                    {
                        id: '5',
                        label: gettext('5'),
                    },
                    {
                        id: '6',
                        label: gettext('6'),
                    },
                ],
                roundCorners: true,
                type: 'text',
                multiple: false,
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Priority'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
    };
};
