import {IAuthoringFieldV2} from 'superdesk-api';

export interface IFieldDefinition {
    fieldId: string;
    getField: (options: {required: boolean, id: string}) => IAuthoringFieldV2;
    storageAdapter?: {
        storeValue: <T extends IPlanningItem>(item: T, operationalValue: unknown) => T; // returns stored value
        retrieveStoredValue:
            <T extends IPlanningItem>(item: T, fieldId: string) => unknown; // returns operational value
    };
}

export type IFieldDefinitions = {[fieldId: string]: IFieldDefinition};
