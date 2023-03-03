import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldEventLinks} from '../editor/EventLinks';

registerEditorField(
    'definition_long',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Long Description'),
        field: 'definition_long',
    }),
    null,
    true
);

registerEditorField(
    'definition_short',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Description'),
        field: 'definition_short',
    }),
    null,
    true
);

registerEditorField(
    'reference',
    EditorFieldMultilingualText,
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
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Registration Details'),
        field: 'registration_details',
    }),
    null,
    false,
);

registerEditorField(
    'invitation_details',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Invitation Details'),
        field: 'invitation_details',
    }),
    null,
    false,
);
