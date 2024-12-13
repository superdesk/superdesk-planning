import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';

export function getDateTimeField(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
    const config: IDateTimeFieldConfig = {
        allowSeconds: false,
    };

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'datetime',
        fieldConfig: {
            ...config,
            required: options.required,
        },
    };

    return field;
}
