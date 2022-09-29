import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldDynamicTextType} from '../editor/base/dynamicTextTypeField';
import {EditorFieldEventLinks} from '../editor/EventLinks';

registerEditorField(
    'definition_long',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Long Description'),
        field: 'definition_long',
    }),
    null,
    true
);

registerEditorField(
    'definition_short',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Description'),
        field: 'definition_short',
    }),
    null,
    true
);

registerEditorField(
    'reference',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Reference'),
        field: 'reference',
    }),
    null,
    true
);

registerEditorField(
    'links',
    EditorFieldEventLinks,
    () => ({
        label: superdeskApi.localization.gettext('Links'),
        field: 'links',
    }),
    null,
    false
);

registerEditorField(
    'registration_details',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Registration Details'),
        field: 'registration_details',
    }),
    null,
    false,
);

registerEditorField(
    'invitation_details',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Invitation Details'),
        field: 'invitation_details',
    }),
    null,
    false,
);
