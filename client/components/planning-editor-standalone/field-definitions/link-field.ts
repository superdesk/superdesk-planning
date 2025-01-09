import {IAuthoringFieldV2, IUrlsFieldConfig} from 'superdesk-api';

export function getLinksField(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
    const config: IUrlsFieldConfig = {
        hideDescription: true,
    };

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'urls',
        fieldConfig: {
            ...config,
            required: options.required,
        },
    };

    return field;
}
