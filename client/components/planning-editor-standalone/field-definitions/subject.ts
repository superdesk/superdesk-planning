import {
    IAuthoringFieldV2,
    ISubjectCode,
    IDropdownConfigManualSource,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IFieldDefinition} from './interfaces';
import {planningApi} from '../../../superdeskApi';

export function getSubjectField(): IFieldDefinition {
    return {
        fieldId: 'subject',
        getField: ({id, required}) => {
            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: (planningApi.redux.store.getState().subjects ?? [])
                    .map((x) => ({id: x.qcode, label: x.name, parent: x.parent})),
                roundCorners: true,
                type: 'text',
                canSelectBranchWithChildren: true,
                multiple: true,
                required: required,
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: 'subject',
                name: gettext('Subject'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return fieldV2;
        },
        storageAdapter: {
            retrieveStoredValue: (item) => {
                return (item.subject ?? []).map(({qcode}) => qcode);
            },
            storeValue: (item, operationalValue: Array<ISubjectCode['qcode']>) => {
                const filteredSubjects: Array<ISubjectCode> = (planningApi.redux.store.getState().subjects ?? [])
                    .filter((x) => operationalValue.includes(x.qcode));

                return {
                    ...item,
                    subject: filteredSubjects,
                };
            },
        }
    };
}
