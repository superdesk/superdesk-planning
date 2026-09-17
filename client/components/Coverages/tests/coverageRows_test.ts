import {appConfig} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';

import {
    IEventItem,
    IG2ContentType,
    IPlanningContentProfile,
    IPlanningNewsCoverageStatus,
} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {
    applyDeskChange,
    applyUserChange,
    buildNewCoverages,
    createRowsFromContentTypes,
    duplicateRow,
    getFilteredLanguages,
    ICoverageLineItem,
    updateRow,
    validateRows,
} from '../coverageRows';

// The functions read only a handful of fields off each entity, so the fixtures are
// narrower than the prop types
const desks = [
    {_id: 'desk1', name: 'Politics', members: [{user: 'user1'}]},
    {_id: 'desk2', name: 'Sports', desk_language: 'fr-CA', members: [{user: 'user2'}]},
] as unknown as Array<IDesk>;

const users = [
    {_id: 'user1', display_name: 'Foo'},
    {_id: 'user2', display_name: 'Bar'},
] as unknown as Array<IUser>;

const contentTypes = [
    {qcode: 'text', name: 'Text'},
    {qcode: 'picture', name: 'Picture'},
] as unknown as Array<IG2ContentType>;

const statusOnMerit = {qcode: 'ncostat:notdec', name: 'coverage not decided yet', label: 'On merit'};

// The label differs from the hardcoded fallback in `getNewsCoverageStatusPlanned` so that
// assertions on it fail if the vocabulary lookup stops working
const statusPlanned = {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned (cv)'};

// `getDefaultCoverageStatus` takes the first entry, so new rows start on 'On merit'
const newsCoverageStatus = [statusOnMerit, statusPlanned] as Array<IPlanningNewsCoverageStatus>;

const languages = [
    {value: {qcode: 'en'}},
    {value: {qcode: 'fr-CA'}},
] as Array<{value: any}>;

const event = {
    _id: 'event1',
    type: 'event',
    language: 'en',
    translations: [
        {field: 'slugline', language: 'fr-CA', value: 'slugline fr'},
        {field: 'headline', language: 'fr-CA', value: 'headline fr'},
        {field: 'internal_note', language: 'fr-CA', value: 'note fr'},
        {field: 'ednote', language: 'fr-CA', value: 'ednote fr'},
        {field: 'slugline', language: 'en', value: 'slugline en'},
    ],
} as unknown as IEventItem;

const createCoverage = (qcode: string) => ({
    planning: {
        g2_content_type: qcode,
        language: null,
    },
    workflow_status: 'draft',
}) as DeepPartial<ICoverageLineItem>;

describe('coverageRows', () => {
    const autoAssignToWorkflowDefault = appConfig.planning_auto_assign_to_workflow;
    const manualStatusDefault = appConfig.planning.manual_news_coverage_status;
    const entitiesDefault = superdeskApi.entities;
    const contentProfilesDefault = planningApi.contentProfiles;

    beforeEach(() => {
        appConfig.planning_auto_assign_to_workflow = false;
        appConfig.planning.manual_news_coverage_status = false;
        superdeskApi.entities = {
            ...superdeskApi.entities,
            vocabulary: {getVocabulary: () => ({items: newsCoverageStatus})},
        } as typeof superdeskApi.entities;
    });

    afterEach(() => {
        appConfig.planning_auto_assign_to_workflow = autoAssignToWorkflowDefault;
        appConfig.planning.manual_news_coverage_status = manualStatusDefault;
        superdeskApi.entities = entitiesDefault;
        planningApi.contentProfiles = contentProfilesDefault;
    });

    const mockMultilingual = (enabled: boolean, profileLanguages: Array<string> = []) => {
        planningApi.contentProfiles = {
            ...planningApi.contentProfiles,
            get: () => ({} as IPlanningContentProfile),
            multilingual: {
                ...planningApi.contentProfiles.multilingual,
                isEnabled: () => enabled,
                getLanguages: () => profileLanguages,
            },
        } as typeof planningApi.contentProfiles;
    };

    const getRows = () => createRowsFromContentTypes(contentTypes, desks, newsCoverageStatus);
    const rules = {plannedOnDesk: true, deskRequiredForWorkflow: true};

    describe('applyDeskChange', () => {
        it('sets the status to Planned when the news coverage status is not manual', () => {
            const [row] = getRows();

            expect(applyDeskChange(row, desks[0], users, languages, rules).status).toEqual(statusPlanned);
        });

        it('leaves the status alone without the planned on desk rule', () => {
            const [row] = getRows();

            expect(applyDeskChange(row, desks[0], users, languages).status).toBeUndefined();
        });

        it('leaves the status alone when the news coverage status is manual', () => {
            appConfig.planning.manual_news_coverage_status = true;

            const [row] = getRows();

            expect(applyDeskChange(row, desks[0], users, languages, rules).status).toBeUndefined();
        });

        it('leaves the status alone on a coverage that already exists', () => {
            const [row] = getRows();
            const saved = {...row, coverage_id: 'cov1', status: statusOnMerit};

            expect(applyDeskChange(saved, desks[0], users, languages, rules).status).toBeUndefined();
        });

        it('leaves the status alone when the desk is cleared', () => {
            const [row] = getRows();

            expect(applyDeskChange({...row, desk: desks[0]}, null, users, languages, rules).status).toBeUndefined();
        });

        it('keeps a user that is a member of the new desk', () => {
            const [row] = getRows();
            const updates = applyDeskChange({...row, user: users[0]}, desks[0], users, languages);

            expect(updates.user).toBe(users[0]);
        });

        it('clears a user that is not a member of the new desk', () => {
            const [row] = getRows();
            const updates = applyDeskChange({...row, user: users[0]}, desks[1], users, languages);

            expect(updates.user).toBe(null);
        });

        it('applies the desk language only when it is one of the filtered languages', () => {
            const [row] = getRows();

            expect(applyDeskChange(row, desks[1], users, languages).planning.language).toBe('fr-CA');
            expect(applyDeskChange(row, desks[1], users, [languages[0]]).planning).toBeUndefined();
        });

        it('does not mutate the row', () => {
            const [row] = getRows();

            applyDeskChange(row, desks[1], users, languages, rules);

            expect(row.desk).toBe(null);
            expect(row.status).toEqual(statusOnMerit);
            expect(row.planning.language).toBe(null);
        });
    });

    describe('applyUserChange', () => {
        it('does not change the status', () => {
            const updates = applyUserChange(users[0], desks);

            expect(updates.status).toBeUndefined();
            expect(updates.user).toBe(users[0]);
            expect(updates.filteredDesks).toEqual([desks[0]]);
        });
    });

    describe('updateRow', () => {
        it('returns a new array without mutating the updated row', () => {
            const rows = getRows();
            const [text, picture] = rows;
            const updated = updateRow(rows, text, {enabled: true, desk: desks[0]});

            expect(updated).not.toBe(rows);
            expect(rows[0]).toBe(text);
            expect(text.enabled).toBe(false);
            expect(text.desk).toBe(null);

            expect(updated[0].enabled).toBe(true);
            expect(updated[0].desk).toBe(desks[0]);
            expect(updated[1]).toBe(picture);
        });
    });

    describe('getFilteredLanguages', () => {
        it('returns every language when the planning profile is not multilingual', () => {
            mockMultilingual(false);

            expect(getFilteredLanguages(languages)).toEqual(languages);
        });

        it('keeps only the languages of the planning profile when it is multilingual', () => {
            mockMultilingual(true, ['fr-CA']);

            expect(getFilteredLanguages(languages)).toEqual([languages[1]]);
        });
    });

    describe('duplicateRow', () => {
        it('inserts a disabled copy after the source row, keeping qcode and language', () => {
            const rows = getRows();
            const source = {...rows[0], enabled: true, desk: desks[1], planning: {language: 'fr-CA'} as any};
            const updated = duplicateRow([source, rows[1]], source, newsCoverageStatus, desks);

            expect(updated.length).toBe(3);
            expect(updated[0]).toBe(source);
            expect(updated[2]).toBe(rows[1]);

            expect(updated[1].qcode).toBe('text');
            expect(updated[1].planning.language).toBe('fr-CA');
            expect(updated[1].enabled).toBe(false);
            expect(updated[1].desk).toBe(null);
            expect(updated[1].rowId).not.toBe(source.rowId);
        });
    });

    describe('validateRows', () => {
        it('requires a desk on every enabled row when auto assign to workflow is on', () => {
            appConfig.planning_auto_assign_to_workflow = true;

            const [text, picture] = getRows();
            const errors = validateRows([{...text, enabled: true}, picture], rules);

            expect(errors[text.rowId]).toEqual({desk: 'Desk is required'});
            expect(errors[picture.rowId]).toBeUndefined();
        });

        it('does not require a desk without the workflow rule when auto assign to workflow is on', () => {
            appConfig.planning_auto_assign_to_workflow = true;

            const [text, picture] = getRows();

            expect(validateRows([{...text, enabled: true}, picture])).toEqual({});
        });

        it('does not require a desk on an existing coverage when auto assign to workflow is on', () => {
            appConfig.planning_auto_assign_to_workflow = true;

            const [text] = getRows();
            const saved = {...text, enabled: true, coverage_id: 'cov1'};

            expect(validateRows([saved], rules)).toEqual({});
            expect(validateRows([{...saved, user: users[0]}], rules)[saved.rowId]).toEqual({desk: 'Desk is required'});
        });

        it('requires a desk only when a user is set when auto assign to workflow is off', () => {
            const [text, picture] = getRows();

            expect(validateRows([{...text, enabled: true}, picture], rules)).toEqual({});

            const errors = validateRows([{...text, enabled: true, user: users[0]}, picture], rules);

            expect(errors[text.rowId]).toEqual({desk: 'Desk is required'});
        });

        it('has no error when the enabled row has a desk', () => {
            appConfig.planning_auto_assign_to_workflow = true;

            const [text] = getRows();

            expect(validateRows([{...text, enabled: true, desk: desks[0], user: users[0]}], rules)).toEqual({});
        });
    });

    describe('buildNewCoverages', () => {
        it('only builds enabled rows without a coverage', () => {
            const [text, picture] = getRows();
            const coverages = buildNewCoverages(
                [{...text, enabled: true}, picture, {...picture, enabled: true, coverage_id: 'cov1'}],
                createCoverage,
                event
            );

            expect(coverages.length).toBe(1);
            expect(coverages[0].planning.g2_content_type).toBe('text');
        });

        it('sets the assignment and the status', () => {
            const [text] = getRows();
            const [coverage] = buildNewCoverages(
                [{...text, enabled: true, desk: desks[0], user: users[0], status: statusPlanned}],
                createCoverage,
                event
            );

            expect(coverage.assigned_to).toEqual({desk: 'desk1', user: 'user1'});
            expect(coverage.news_coverage_status).toEqual(statusPlanned);
        });

        it('copies the translated event fields for the language of the row', () => {
            const [text] = getRows();
            const [coverage] = buildNewCoverages(
                [{...text, enabled: true, planning: {language: 'fr-CA'} as any}],
                createCoverage,
                event
            );

            expect(coverage.planning).toEqual(jasmine.objectContaining({
                language: 'fr-CA',
                slugline: 'slugline fr',
                headline: 'headline fr',
                internal_note: 'note fr',
                ednote: 'ednote fr',
            }));
        });

        it('leaves the coverage fields alone when the row has no language', () => {
            const [text] = getRows();
            const [coverage] = buildNewCoverages([{...text, enabled: true}], createCoverage, event);

            expect(coverage.planning).toEqual({g2_content_type: 'text', language: null});
        });

        it('does not copy translated fields without an event', () => {
            const [text] = getRows();
            const [coverage] = buildNewCoverages(
                [{...text, enabled: true, planning: {language: 'fr-CA'} as any}],
                createCoverage
            );

            expect(coverage.planning).toEqual({g2_content_type: 'text', language: 'fr-CA'});
        });
    });
});
