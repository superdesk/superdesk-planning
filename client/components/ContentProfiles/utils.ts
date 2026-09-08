import {IPlanningContentProfile} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {isProfileFieldEnabled, getFieldNameTranslated} from '../../utils/contentProfiles';

export function validateAndNotifyForRequiredFields(
    profile: IPlanningContentProfile | Partial<IPlanningContentProfile>,
    requiredFields: Array<string>,
    includeGroupCheck: boolean
): boolean {
    const {notify} = superdeskApi.ui;
    const {gettext} = superdeskApi.localization;
    let valid = true;

    requiredFields.forEach((field) => {
        if (!isProfileFieldEnabled(profile, field, includeGroupCheck)) {
            notify.error(gettext('"{{fieldName}}" field is required by the system', {
                fieldName: getFieldNameTranslated(field).toUpperCase()
            }));

            valid = false;
        }
    });

    return valid;
}
