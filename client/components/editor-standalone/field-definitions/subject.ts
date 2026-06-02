import {
    IAuthoringFieldV2,
    ISubjectCode,
    IDropdownConfigManualSource,
} from 'superdesk-api';
import {IFieldDefinition, IFieldStorageAdapter} from './interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

function getStorageAdapterCommon<T extends IPlanningItem | IEventItem>(): IFieldStorageAdapter<T> {
    const storageAdapterCommon: IFieldStorageAdapter<T> = {
        retrieveStoredValue: (item) => {
            return (item.subject ?? []).map(({qcode}) => qcode);
        },
        storeValue: (item, operationalValue: Array<ISubjectCode['qcode']>) => {
            const subjectsFull: Array<ISubjectCode> = (planningApi.redux.store.getState().subjects ?? [])
                .filter((x) => operationalValue.includes(x.qcode));

            return {
                ...item,
                subject: subjectsFull,
            };
        },
    };

    return storageAdapterCommon;
}

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
                name: superdeskApi.localization.gettext('Subject'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return fieldV2;
        },
        storageAdapterPlanning: getStorageAdapterCommon(),
        storageAdapterEvent: getStorageAdapterCommon(),
    };
}
