import {ICustomFieldType} from 'superdesk-api';
import {superdesk} from '../../superdesk';
import {
    IRecurringRulesFieldConfig,
    IRecurringRulesFieldUserPreferences,
    IRecurringRulesValueOperational,
    IRecurringRulesValueStorage,
} from './interfaces';
import {Editor} from './editor';
import {Preview} from './preview';

const {gettext} = superdesk.localization;

export function getRecurringRulesField(): ICustomFieldType<
    IRecurringRulesValueOperational,
    IRecurringRulesValueStorage,
    IRecurringRulesFieldConfig,
    IRecurringRulesFieldUserPreferences
> {
    const field: ReturnType<typeof getRecurringRulesField> = {
        id: 'recurring_rules-react',
        generic: false,
        label: gettext('Repeats'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => Object.keys(valueOperational).length > 0,
        getEmptyValue: () => {
            return {} as IRecurringRulesValueOperational;
        },

        configComponent: () => null,
    };

    return field;
}
