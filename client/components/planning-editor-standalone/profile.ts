import {OrderedMap} from 'immutable';

import {
    IAuthoringFieldV2,
    IContentProfileV2,
    IEditor3Config,
} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {getEditorFormGroupsFromProfile} from '../../utils/contentProfiles';

function getTextFieldConfig(options: {id: string; label: string}): IAuthoringFieldV2 {
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

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'editor3',
        fieldConfig: {
            ...editor3ConfigWithoutFormatting,
            required: true,
        },
    };

    return field;
}

export function getProfile() {
    const planningProfile = planningApi.contentProfiles.get('planning');
    const planningGroups = getEditorFormGroupsFromProfile(planningProfile);
    const planningFieldIds = Object.values(planningGroups).flatMap(({fields}) => fields);
    const {gettext} = superdeskApi.localization;

    const profileV2: IContentProfileV2 = {
        id: 'not-used',
        name: 'not-used',
        content: OrderedMap([]),
        header: OrderedMap(),
    };

    for (const fieldId of planningFieldIds) {
        if (fieldId === 'slugline') {
            profileV2.header = profileV2.header.set(
                'slugline',
                getTextFieldConfig({id: 'slugline', label: gettext('Slugline')}),
            );
        }
    }

    profileV2.header.forEach((item) => {
        item.fieldConfig.width = 100;
    });

    return profileV2;
}
