import {IAuthoringFieldV2, IEditor3Config} from 'superdesk-api';
import {IBaseFieldDefinition, IEditor3Definition} from './interfaces';

export function getTextFieldConfig(
    options: (IBaseFieldDefinition<'base'> | IEditor3Definition) & {label: string},
): IAuthoringFieldV2 {
    const editor3ConfigWithoutFormatting: IEditor3Config = options.type === 'base' ? {
        editorFormat: [],
        minLength: undefined,
        maxLength: undefined,
        cleanPastedHtml: false,
        singleLine: true,
        disallowedCharacters: [],
        showStatistics: false,
        width: 100,
    } : {
        editorFormat: options.formattingOptions ?? [],
        minLength: options.minLength ?? undefined,
        maxLength: options.maxLength ?? undefined,
        cleanPastedHtml: true,
        singleLine: false,
        disallowedCharacters: [],
        showStatistics: true,
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
