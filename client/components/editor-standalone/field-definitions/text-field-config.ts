import {IAuthoringFieldV2, IEditor3Config} from 'superdesk-api';
import {IBaseFieldDefinition, IEditor3Definition, IMultiLineDefinition} from './interfaces';
import {superdeskApi} from '../../../superdeskApi';

export function getTextFieldConfig(
    options: (IBaseFieldDefinition<'base'> | IEditor3Definition | IMultiLineDefinition) & {label: string},
): IAuthoringFieldV2 {
    const editor3Config: IEditor3Config = (() => {
        const basicOptions = {
            disallowedCharacters: [],
            showStatistics: true,
            width: 100,
        };
        const fieldType = options.type;

        if (fieldType === 'base') {
            return {
                editorFormat: [],
                minLength: undefined,
                maxLength: undefined,
                cleanPastedHtml: true,
                singleLine: true,
                ...basicOptions,
            };
        } else if (fieldType === 'editor3') {
            return {
                editorFormat: options.formattingOptions ?? [],
                minLength: options.minLength ?? undefined,
                maxLength: options.maxLength ?? undefined,
                cleanPastedHtml: false,
                singleLine: false,
                ...basicOptions,
            };
        } else if (fieldType === 'multi_line') {
            return {
                editorFormat: [],
                minLength: options.minLength ?? undefined,
                maxLength: options.maxLength ?? undefined,
                cleanPastedHtml: true,
                singleLine: false,
                expandable: options.expandable ? {
                    enabled: true,
                    defaultValue: false,
                    numberOfRowsWhenCollapsed: 4,
                } : undefined,
                ...basicOptions,
            };
        }

        return superdeskApi.helpers.assertNever(fieldType);
    })();

    const fieldConfig: IEditor3Config = {
        ...editor3Config,
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
