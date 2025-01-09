import {IAuthoringFieldV2} from 'superdesk-api';

export interface IFieldStorageAdapter<T> {
    storeValue:(item: T, operationalValue: unknown) => T; // returns stored value
    retrieveStoredValue: (item: T, fieldId: string) => unknown; // returns operational value
}

export interface IFieldDefinition {
    fieldId: string;
    getField: (options: {required: boolean, id: string}) => IAuthoringFieldV2;
    storageAdapterPlanning?: IFieldStorageAdapter<IPlanningItem>;
    storageAdapterEvent?: IFieldStorageAdapter<IEventItem>;
}

export type IFieldDefinitions = {[fieldId: string]: IFieldDefinition};
