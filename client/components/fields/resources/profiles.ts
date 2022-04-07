import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';
import {SelectEditor3FormattingOptions} from '../editor/SelectEditor3FormattingOptions';
import {EditorFieldNumber} from '../editor/base/number';
import {EditorFieldToggle} from '../editor/base/toggle';
import {EditorFieldSelect} from '../editor/base/select';
import {EditorFieldCheckbox} from '../editor/base/checkbox';

// TODO: Change this to a checkbox
registerEditorField(
    'schema.required',
    EditorFieldCheckbox,
    () => ({
        label: superdeskApi.localization.gettext('Required'),
        field: 'schema.required',
    }),
    null,
    true
);

registerEditorField(
    'schema.format_options',
    SelectEditor3FormattingOptions,
    () => ({
        label: superdeskApi.localization.gettext('Formatting Options'),
        field: 'schema.format_options',
    }),
    null,
    true
);

registerEditorField(
    'schema.minlength',
    EditorFieldNumber,
    () => ({
        label: superdeskApi.localization.gettext('Min'),
        field: 'schema.minlength',
    }),
    null,
    true
);

registerEditorField(
    'schema.maxlength',
    EditorFieldNumber,
    () => ({
        label: superdeskApi.localization.gettext('Max'),
        field: 'schema.maxlength',
    }),
    null,
    true
);

registerEditorField(
    'schema.expandable',
    EditorFieldToggle,
    () => ({
        label: superdeskApi.localization.gettext('Expandable'),
        field: 'schema.expandable',
    }),
    null,
    true
);

registerEditorField(
    'schema.field_type',
    EditorFieldSelect,
    () => ({
        label: superdeskApi.localization.gettext('Input Type'),
        field: 'schema.field_type',
        options: [
            {qcode: 'single_line', label: superdeskApi.localization.gettext('Single Line')},
            {qcode: 'multi_line', label: superdeskApi.localization.gettext('Multi Line')},
            {qcode: 'editor_3', label: superdeskApi.localization.gettext('Editor 3')},
        ],
        valueAsString: true,
    }),
    null,
    true
);