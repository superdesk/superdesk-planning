import {orderBy} from 'lodash';

import {
    BOOKMARK_TYPE,
    IEditorBookmark,
    IEditorProfile,
    IEditorProfileGroup,
    IPlanningContentProfile,
    IProfileFieldEntry,
    IEditorFormGroup,
} from '../interfaces';
import {superdeskApi} from '../superdeskApi';

import {getVocabularyItemFieldTranslated} from './vocabularies';
import {getUserInterfaceLanguageFromCV} from './users';

export function getProfileGroupIdsSorted(profile: IEditorProfile): Array<IEditorProfileGroup['_id']> {
    return Object.keys(profile.groups ?? {})
        .filter((groupId) => profile.groups[groupId] != null)
        .sort((a, b) => profile.groups[a].index - profile.groups[b].index);
}

export function getProfileGroupsSorted(profile: IEditorProfile): Array<IEditorProfileGroup> {
    return getProfileGroupIdsSorted(profile).map((groupId) => profile.groups[groupId]);
}

export function sortProfileGroups(profile: IEditorProfile): IEditorProfile {
    getProfileGroupIdsSorted(profile).forEach((groupId, index) => {
        profile.groups[groupId].index = index;
    });

    return profile;
}

export function getProfileFields(profile: IEditorProfile): Array<IProfileFieldEntry> {
    return Object
        .keys(profile.editor)
        .map((fieldName) => ({
            name: fieldName,
            field: profile.editor[fieldName],
            schema: profile.schema[fieldName],
        }));
}

export function getEnabledProfileFields(profile: IEditorProfile): Array<IProfileFieldEntry> {
    return getProfileFields(profile).filter(
        (item) => item.field.enabled
    );
}

export function getEnabledProfileGroupFields(
    profile: IEditorProfile,
    groupId: IEditorProfileGroup['_id']
): Array<IProfileFieldEntry> {
    return getProfileFields(profile).filter(
        (item) => item.field.group === groupId && item.field.enabled
    );
}

export function getGroupFieldsSorted(
    profile: IEditorProfile,
    groupId?: IEditorProfileGroup['_id']
): Array<IProfileFieldEntry> {
    const fields = (groupId == null ?
        getEnabledProfileFields(profile) :
        getEnabledProfileGroupFields(profile, groupId)
    ).sort(
        (a, b) => a.field.index - b.field.index
    );

    // Make sure each field has the correct index (there could be duplicates)
    fields.forEach((item, index) => {
        item.field.index = index;
    });

    return fields;
}

export function getUnusedProfileFields(
    profile: IEditorProfile,
    includeGroupCheck: boolean = true
): Array<IProfileFieldEntry> {
    return orderBy(
        getProfileFields(profile).filter(
            (item) => (includeGroupCheck && item.field.group == null) || !item.field.enabled
        ),
        'name'
    );
}

export function isProfileFieldEnabled(
    profile: IPlanningContentProfile,
    field: string,
    includeGroupCheck: boolean
): boolean {
    return profile.editor[field]?.enabled && (!includeGroupCheck || profile.editor[field]?.group != null);
}

export function getProfileGroupNameTranslated(group: IEditorProfileGroup): string {
    const language = getUserInterfaceLanguageFromCV();

    return getVocabularyItemFieldTranslated(
        group,
        'name',
        language
    );
}

export function getEditorFormGroupsFromProfile(profile: IEditorProfile): {[key: string]: IEditorFormGroup} {
    const groups: {[key: string]: IEditorFormGroup} = {};

    getProfileGroupIdsSorted(profile).forEach((groupId, index) => {
        const group = profile.groups[groupId];

        groups[groupId] = {
            id: groupId,
            index: index,
            icon: group.icon,
            showBookmark: group.showBookmark,
            useToggleBox: group.useToggleBox,
            title: getProfileGroupNameTranslated(group),
            fields: getGroupFieldsSorted(profile, group._id)
                .filter((item) => item.field.enabled)
                .map((item) => item.name),
        };
    });

    return groups;
}

export function getBookmarksFromFormGroups(groups: {[key: string]: IEditorFormGroup}): Array<IEditorBookmark> {
    return Object.keys(groups).map((groupId, index) => {
        const group = groups[groupId];

        return {
            id: group.id,
            group_id: group.id,
            type: BOOKMARK_TYPE.formGroup,
            icon: group.icon,
            index: group.index,
            name: group.title,
            tooltip: group.title,
            disabled: !group.fields.length || !group.showBookmark,
        };
    });
}

export function getFieldNameTranslated(field: string): string {
    const {gettext} = superdeskApi.localization;

    switch (field) {
    case 'recurring_rules':
        return gettext('Recurring Rules');
    case 'dates':
        return gettext('Dates');
    case 'language':
        return gettext('Language');
    case 'slugline':
        return gettext('Slugline');
    case 'name':
        return gettext('Name');
    case 'definition_short':
        return gettext('Description Short');
    case 'reference':
        return gettext('Reference');
    case 'calendars':
        return gettext('Calendars');
    case 'place':
        return gettext('Place');
    case 'occur_status':
        return gettext('Occur Status');
    case 'location':
        return gettext('Location');
    case 'event_contact_info':
        return gettext('Contacts');
    case 'anpa_category':
        return gettext('ANPA Category');
    case 'subject':
        return gettext('Subject');
    case 'definition_long':
        return gettext('Description Long');
    case 'internal_note':
        return gettext('Internal Note');
    case 'ednote':
        return gettext('Editorial Note');
    case 'files':
        return gettext('Files');
    case 'links':
        return gettext('Links');
    case 'related_plannings':
        return gettext('Related Plannings');
    case 'planning_date':
        return gettext('Planning Date');
    case 'description_text':
        return gettext('Description Text');
    case 'agendas':
        return gettext('Agendas');
    case 'urgency':
        return gettext('Urgency');
    case 'marked_for_not_publication':
        return gettext('Marked For Not Publication');
    case 'overide_auto_assign_to_workflow':
        return gettext('Override Auto Assign to Workflow');
    case 'associated_event':
        return gettext('Associated Event');
    case 'coverages':
        return gettext('Coverages');
    case 'custom_vocabularies':
        return gettext('Custom Vocabularies');
    case 'headline':
        return gettext('Headline');
    case 'g2_content_type':
        return gettext('Content Type');
    case 'genre':
        return gettext('Genre');
    case 'news_coverage_status':
        return gettext('Coverage Status');
    case 'scheduled':
        return gettext('Scheduled');
    case 'scheduled_updates':
        return gettext('Scheduled Updates');
    case 'contact_info':
        return gettext('Contacts');
    case 'keyword':
        return gettext('Keywords');
    case 'no_content_linking':
        return gettext('No Content Linking');
    case 'xmp_file':
        return gettext('XMP File');
    case 'registration_details':
        return gettext('Registration Details');
    case 'invitation_details':
        return gettext('Invitation Details');
    case 'accreditation_info':
        return gettext('Accreditation Info');
    case 'accreditation_deadline':
        return gettext('Accreditation Deadline');
    }

    return field;
}
