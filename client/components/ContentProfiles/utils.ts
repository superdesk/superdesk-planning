import {ICoverageFormProfile, IPlanningContentProfile} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {isProfileFieldEnabled, getFieldNameTranslated} from '../../utils/contentProfiles';

export function validateRequiredFields(
    profile: IPlanningContentProfile | ICoverageFormProfile,
    requiredFields: Array<Array<string>>,
    includeGroupCheck: boolean
): boolean {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    let valid = true;

    requiredFields.forEach((fields) => {
        const result = fields.some(
            (field) => isProfileFieldEnabled(profile, field, includeGroupCheck)
        );

        if (!result) {
            valid = false;
            if (fields.length === 1) {
                notify.error(gettext('"{{field}}" field is required by the system', {
                    field: getFieldNameTranslated(fields[0]).toUpperCase()
                }));
            } else {
                notify.error(gettext('At least one "{{fields}}" fields are required by the system', {
                    fields: fields
                        .map((field) => getFieldNameTranslated(field).toUpperCase())
                        .join('", "')
                }));
            }
        }
    });

    return valid;
}
