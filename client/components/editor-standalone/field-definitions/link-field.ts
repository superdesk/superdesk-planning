import {IAuthoringFieldV2, IUrlsFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

export const getLinksField = (): IFieldDefinition => ({
    fieldId: 'links',
    getField: ({id, required}) => {
        const config: IUrlsFieldConfig = {
            hideDescription: true,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Links'),
            fieldType: 'urls',
            fieldConfig: {
                required: required,
                ...config,
            },
        };

        return field;
    },
    storageAdapterEvent: {
        storeValue: (item, operationalValue: Array<{url: string; description?: string}>) => ({
            ...item,
            links: operationalValue.map((x) => x.url),
        }),
        retrieveStoredValue: (item, fieldId) =>
            (item[fieldId] ?? []).map((x) => ({url: x, description: x.description})),
    }
});
