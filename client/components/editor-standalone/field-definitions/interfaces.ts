import {IAuthoringFieldV2, RICH_FORMATTING_OPTION} from 'superdesk-api';

export interface IFieldStorageAdapter<T> {
    storeValue:(item: T, operationalValue: unknown) => T; // returns stored value
    retrieveStoredValue: (item: T, fieldId: string) => unknown; // returns operational value
}

export interface IBaseFieldDefinition<T> {
    type: T,
    id: string;
    required: boolean;
    language: string;
}

export interface IEditor3Definition extends IBaseFieldDefinition<'editor3'> {
    formattingOptions?: Array<RICH_FORMATTING_OPTION>;
    maxLength?: number;
    minLength?: number;
}

export interface IFieldDefinition {
    fieldId: string;
    getField: (options: IBaseFieldDefinition<'base'> | IEditor3Definition) => IAuthoringFieldV2;
    storageAdapterPlanning?: IFieldStorageAdapter<IPlanningItem>;
    storageAdapterEvent?: IFieldStorageAdapter<IEventItem>;
}

export type IFieldDefinitions = {[fieldId: string]: IFieldDefinition};
