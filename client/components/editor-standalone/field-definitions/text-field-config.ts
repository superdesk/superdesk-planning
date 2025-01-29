import {IAuthoringFieldV2, IEditor3Config} from 'superdesk-api';

export function getTextFieldConfig(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
    const editor3ConfigWithoutFormatting: IEditor3Config = {
        editorFormat: [],
        minLength: undefined,
        maxLength: undefined,
        cleanPastedHtml: false,
        singleLine: true,
        disallowedCharacters: [],
        showStatistics: false,
        width: 100,
    };

    const fieldConfig: IEditor3Config = {
        ...editor3ConfigWithoutFormatting,
        required: options.required,
        compact: true,
    };

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'editor3',
        fieldConfig: fieldConfig,
    };

    return field;
}
