import {ICoverageContentProfile, IPlanningContentProfile} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {isProfileFieldEnabled, getFieldNameTranslated} from '../../utils/contentProfiles';

/**
 * Used on submit in ContentProfileModal.tsx, thus why we need the notifications.
 * Also used when you try deleting a required frield.
 */
export function validateAndNofityForRequiredFields(
    profile: IPlanningContentProfile | Partial<ICoverageContentProfile>,
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
