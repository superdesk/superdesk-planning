import {uniqueId} from 'lodash';
import {appConfig} from 'appConfig';

import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';
import {
    ICoveragePlanningDetails,
    IEventItem,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';

import {gettext, getDesksForUser, getUsersForDesk, planningUtils} from '../../utils';
import {getNewsCoverageStatusPlanned} from '../../utils/vocabularies';
import {getTranslatedValue} from '../fields';
import {planningApi} from '../../superdeskApi';

export interface ICoverageLineItem extends IPlanningCoverageItem {
    enabled: boolean;
    qcode: string;
    desk: IDesk;
    user: IUser;
    status: IPlanningNewsCoverageStatus;
    filteredDesks: Array<IDesk>;
    filteredUsers: Array<IUser>;

    // frontend-only stable identity used for React keys and focus management
    rowId: string;
}

export interface ICoverageRowErrors {
    desk?: string;
}

export type ICoverageRow = Partial<ICoverageLineItem>;

type ILanguageOption = {value: IVocabularyItem};

// Event fields copied into a coverage that has its own language
const TRANSLATED_FIELDS = ['slugline', 'headline', 'internal_note', 'ednote'];

export function createRowsFromContentTypes(
    contentTypes: Array<IG2ContentType>,
    desks: Array<IDesk>,
    users: Array<IUser>,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>
): Array<ICoverageRow> {
    return contentTypes.map((contentType) => ({
        rowId: uniqueId('coverage-row-'),
        enabled: false,
        qcode: contentType.qcode,
        workflow_status: 'draft',
        planning: {language: null} as ICoveragePlanningDetails,
        desk: null,
        filteredDesks: desks,
        user: null,
        filteredUsers: users,
        status: planningUtils.getDefaultCoverageStatus(newsCoverageStatus),
    }));
}

export function updateRow(
    rows: Array<ICoverageRow>,
    row: ICoverageRow,
    updates: ICoverageRow
): Array<ICoverageRow> {
    return rows.map((current) => current.rowId === row.rowId ?
        {...current, ...updates} :
        current
    );
}

export function duplicateRow(
    rows: Array<ICoverageRow>,
    row: ICoverageRow,
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>,
    desks: Array<IDesk>,
    users: Array<IUser>
): Array<ICoverageRow> {
    const index = rows.findIndex((current) => current.rowId === row.rowId);
    const duplicate: ICoverageRow = {
        rowId: uniqueId('coverage-row-'),
        enabled: false,
        qcode: row.qcode,
        workflow_status: 'draft',
        planning: {language: row.planning?.language} as ICoveragePlanningDetails,
        desk: null,
        filteredDesks: desks,
        user: null,
        filteredUsers: users,
        status: planningUtils.getDefaultCoverageStatus(newsCoverageStatus),
    };

    return [
        ...rows.slice(0, index + 1),
        duplicate,
        ...rows.slice(index + 1),
    ];
}

export function applyDeskChange(
    row: ICoverageRow,
    desk: IDesk | null,
    users: Array<IUser>,
    filteredLanguages: Array<ILanguageOption>
): ICoverageRow {
    const deskUsers = getUsersForDesk(desk, users);
    const user = row.user != null && deskUsers.some(({_id}) => _id === row.user._id) ?
        row.user :
        null;

    const updates: ICoverageRow = {
        desk: desk,
        user: user,
        filteredUsers: deskUsers,
    };

    const deskLanguage = desk?.desk_language;

    if (deskLanguage != null && filteredLanguages.some((language) => language.value.qcode === deskLanguage)) {
        updates.planning = {
            ...(row.planning ?? {}),
            language: deskLanguage,
        } as ICoveragePlanningDetails;
    }

    if (desk != null && appConfig.planning.manual_news_coverage_status !== true) {
        const planned = getNewsCoverageStatusPlanned();

        if (row.status?.qcode !== planned.qcode) {
            updates.status = planned;
        }
    }

    return updates;
}

export function applyUserChange(user: IUser | null, desks: Array<IDesk>): ICoverageRow {
    return {
        user: user,
        filteredDesks: getDesksForUser(user, desks),
    };
}

/**
 * Languages a coverage may use: all of them, or only the ones the planning profile is configured with
 */
export function getFilteredLanguages(allLanguages: Array<ILanguageOption>): Array<ILanguageOption> {
    const {multilingual} = planningApi.contentProfiles;
    const planningProfile = planningApi.contentProfiles.get('planning');

    if (!multilingual.isEnabled(planningProfile)) {
        return allLanguages;
    }

    const profileLanguages = multilingual.getLanguages(planningProfile);

    return allLanguages.filter((language) => profileLanguages.includes(language.value.qcode));
}

export function validateRows(rows: Array<ICoverageRow>): Dictionary<string, ICoverageRowErrors> {
    const errors: Dictionary<string, ICoverageRowErrors> = {};

    rows.forEach((row) => {
        if (row.enabled !== true || row.desk != null) {
            return;
        }

        const deskRequired = row.user != null ||
            (row.coverage_id == null && appConfig.planning_auto_assign_to_workflow === true);

        if (deskRequired) {
            errors[row.rowId] = {desk: gettext('Desk is required')};
        }
    });

    return errors;
}

export function buildNewCoverage(
    row: ICoverageRow,
    createCoverage: (qcode: IG2ContentType['qcode']) => DeepPartial<ICoverageLineItem>,
    event?: IEventItem
): DeepPartial<ICoverageLineItem> {
    const coverage = createCoverage(row.qcode);
    const language = row.planning?.language;

    coverage.assigned_to = {
        ...(coverage.assigned_to ?? {}),
        user: row.user?._id,
        desk: row.desk?._id,
    };

    if (language) {
        coverage.planning = {
            ...coverage.planning,
            language: language,
        };

        if (event != null) {
            TRANSLATED_FIELDS.forEach((field) => {
                const value = getTranslatedValue(language, event, field);

                if (value != null) {
                    coverage.planning[field] = value;
                }
            });
        }
    }

    if (row.status != null) {
        coverage.news_coverage_status = row.status;
    }

    return coverage;
}

export function buildNewCoverages(
    rows: Array<ICoverageRow>,
    createCoverage: (qcode: IG2ContentType['qcode']) => DeepPartial<ICoverageLineItem>,
    event?: IEventItem
): Array<DeepPartial<ICoverageLineItem>> {
    return rows
        .filter((row) => row.enabled === true && row.coverage_id == null)
        .map((row) => buildNewCoverage(row, createCoverage, event));
}
