import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldText} from '../editor/base/text';
import {EditorFieldTextArea} from '../editor/base/textArea';
import {EditorFieldSelectWithFreeText} from '../editor/base/selectWithFreeText';

import * as selectors from '../../../selectors';

// Editor Fields
registerEditorField(
    'location.name',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('Name'),
        field: 'location.name',
    })
);
registerEditorField(
    'location.address',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('Address'),
        field: 'location.address.line[0]',
    })
);
registerEditorField(
    'location.area',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('Area'),
        field: 'location.address.area',
    })
);
registerEditorField(
    'location.suburb',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('Suburb'),
        field: 'location.address.suburb',
    })
);
registerEditorField(
    'location.city',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('City/Town'),
        field: 'location.address.city',
    })
);
registerEditorField(
    'location.locality',
    EditorFieldText,
    () => ({
        label: superdeskApi.localization.gettext('Locality'),
        field: 'location.address.locality',
    })
);
registerEditorField(
    'location.region',
    EditorFieldSelectWithFreeText,
    () => ({
        label: superdeskApi.localization.gettext('State/Province/Region'),
        field: 'state',
        labelField: 'name',
    }),
    (state) => ({
        options: selectors.general.regions(state),
    })
);
registerEditorField(
    'location.postal_code',
    EditorFieldText,
    (currentProps) => ({
        label: superdeskApi.localization.gettext('Post Code'),
        field: 'location.address.postal_code',
    })
);
registerEditorField(
    'location.country',
    EditorFieldSelectWithFreeText,
    (currentProps) => ({
        label: superdeskApi.localization.gettext('Country'),
        field: 'country',
        labelField: 'name',
    }),
    (state) => ({
        options: selectors.general.countries(state),
    })
);
registerEditorField(
    'location.notes',
    EditorFieldTextArea,
    () => ({
        label: superdeskApi.localization.gettext('Notes'),
        field: 'location.details[0]',
        rows: 3,
        autoHeight: false,
        labelIcon: 'icon-info-sign icon--blue sd-padding-r--3',
    })
);
