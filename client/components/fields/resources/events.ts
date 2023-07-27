import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldDateTime} from '../editor/base/dateTime';
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
        label: superdeskApi.localization.gettext('Short Description'),
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

registerEditorField(
    'accreditation_info',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Accreditation Info'),
        field: 'accreditation_info',
    }),
    null,
    false,
);

registerEditorField(
    'accreditation_deadline',
    EditorFieldDateTime,
    () => ({
        label: superdeskApi.localization.gettext('Accreditation Deadline'),
        field: 'accreditation_deadline',
        singleValue: true,
    }),
    null,
    false,
);
