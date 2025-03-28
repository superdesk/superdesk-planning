import {SyntheticEvent} from 'react';
import {ICoverageContentProfile, IPlanningContentProfile} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {isProfileFieldEnabled, getFieldNameTranslated} from '../../utils/contentProfiles';

export function validateAndNotifyForRequiredFields(
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

export function shouldNotStartDragging(event: SyntheticEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const addButton = target.closest('.profile-item__add-btn');
    const removeButton = target.closest('.sd-list-item__action-menu');

    // if user is trying to click the bottom or top plus button,
    // or the remove button don't start dragging
    return addButton !== null || removeButton !== null;
}
