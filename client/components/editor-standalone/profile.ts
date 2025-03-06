import {OrderedMap} from 'immutable';

import {IContentProfileV2} from 'superdesk-api';
import {getPlanningProfileFields} from './profile-fields';
import {getFieldDefinitions} from './field-definitions/index';

export function getProfile(profileType: 'event' | 'planning', language: string) {
    const planningFieldIds = getPlanningProfileFields({embeddedOnly: true, profile: profileType});
    const skipped = new Set<string>();
    const fieldDefinitions = getFieldDefinitions(profileType);
    const profileV2: IContentProfileV2 = {
        id: 'not-used',
        name: 'not-used',
        content: OrderedMap([]),
        header: OrderedMap(),
    };

    for (const {fieldId, required} of planningFieldIds) {
        if (fieldDefinitions[fieldId] != null) {
            profileV2.header = profileV2.header.set(
                fieldId,
                fieldDefinitions[fieldId].getField({id: fieldId, required: required, language: language}),
            );
        } else {
            skipped.add(fieldId);
        }
    }

    profileV2.header.forEach((item) => {
        item.fieldConfig.width = 100;
    });

    // PR-TODO: remove comment
    // eslint-disable-next-line no-console
    console.log('skipped -------------------------------- ', skipped);

    return profileV2;
}
