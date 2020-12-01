import React from 'react';
import {connect} from 'react-redux';
import {get, cloneDeep, some, isEqual, isEmpty} from 'lodash';

import {appConfig} from 'appConfig';
import {IArticle, IDesk, ISubject, IUser, IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {
    IAgenda,
    IANPACategory,
    IAssignmentPriority,
    ICoverageFormProfile,
    ICoverageProvider,
    IEventItem,
    IFormNavigation,
    IG2ContentType,
    IGenre,
    IKeyword,
    ILocator,
    ILockedItems,
    IPlanningFormProfile,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    IUrgency,
    IFile,
    IPlanningCoverageItem,
    IFormItemManager,
    ICoverageScheduledUpdate,
} from '../../../interfaces';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {
    getItemInArrayById,
    planningUtils,
    isSameItemId,
    editorMenuUtils,
    isExistingItem,
    eventUtils,
    getItemId,
    getFileDownloadURL,
} from '../../../utils';

import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    TextAreaInput,
    ExpandableTextAreaInput,
    SelectMetaTermsInput,
    ToggleInput,
    ColouredValueInput,
    Field,
    FileInput,
    DateTimeInput,
    SelectInput,
} from '../../UI/Form';
import {ToggleBox} from '../../UI';

import {PlanningEditorHeader} from './PlanningEditorHeader';
import {CoverageArrayInput} from '../../Coverages';
import {EventMetadata} from '../../Events';
import {WORKFLOW_STATE, COVERAGES, TO_BE_CONFIRMED_FIELD} from '../../../constants';
import CustomVocabulariesFields from '../../CustomVocabulariesFields';
import {getUsersDefaultLanguage} from '../../../utils/users';

const toggleDetails = [
    'ednote',
    'anpa_category',
    'subject',
];

interface IProps {
    item?: IPlanningItem;
    diff: Partial<IPlanningItem>;
    itemExists: boolean;
    event?: IEventItem;
    onChangeHandler(field: string, value: any, formDirty?: boolean): void;
    locators: Array<ILocator>;
    languages: Array<string>;
    categories: Array<IANPACategory>;
    subjects: Array<ISubject>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    agendas: Array<IAgenda>;
    readOnly: boolean;
    urgencies: Array<IUrgency>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    genres: Array<IGenre>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    keywords: Array<IKeyword>;
    addNewsItemToPlanning?: IArticle;
    desk: string;
    user: string;
    errors: {[key: string]: string};
    submitting: boolean;
    submitFailed: boolean;
    dirty: boolean;
    planningProfile: IPlanningFormProfile;
    coverageProfile: ICoverageFormProfile;
    currentAgenda?: IAgenda;
    lockedItems: ILockedItems;
    navigation?: IFormNavigation;
    customVocabularies: Array<IVocabulary>;
    fetchEventFiles(event: IEventItem): Promise<void>;
    files: Array<IFile>;
    popupContainer(): HTMLElement;
    defaultDesk: IDesk;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    removeFile(file: IFile): Promise<void>;
    fetchPlanningFiles(item: IPlanningItem): Promise<void>;
    preferredCoverageDesks: {[key: string]: string};
    onPopupOpen(): void;
    onPopupClose(): void;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    inModalView: boolean;
    itemManager: IFormItemManager;
    original?: IPlanningItem;
    planningAllowScheduledUpdates: boolean;
    coverageAddAdvancedMode: boolean;
    setCoverageAddAdvancedMode(enabled: boolean): Promise<void>;
    notifyValidationErrors(errors: Array<string>): void;
}

interface IState {
    openCoverageIds: Array<string>;
    uploading: boolean;
}

const mapStateToProps = (state) => ({
    languages: selectors.vocabs.getLanguages(state),
    locators: selectors.vocabs.locators(state),
    categories: selectors.vocabs.categories(state),
    subjects: selectors.vocabs.subjects(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    agendas: selectors.general.agendas(state),
    urgencies: state.urgency.urgency,
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    genres: state.genres,
    coverageProviders: selectors.vocabs.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    keywords: selectors.general.keywords(state),
    desk: selectors.general.currentDeskId(state),
    user: selectors.general.currentUserId(state),
    planningProfile: selectors.forms.planningProfile(state),
    coverageProfile: selectors.forms.coverageProfile(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    lockedItems: selectors.locks.getLockedItems(state),
    customVocabularies: state.customVocabularies,
    files: selectors.general.files(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: get(selectors.general.preferredCoverageDesks(state), 'desks'),
    planningAllowScheduledUpdates: selectors.forms.getPlanningAllowScheduledUpdates(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    setCoverageDefaultDesk: (coverage) => dispatch(actions.users.setCoverageDefaultDesk(coverage)),
    uploadFiles: (files) => dispatch(actions.planning.api.uploadFiles({files: files})),
    removeFile: (file) => dispatch(actions.planning.api.removeFile(file)),
    fetchPlanningFiles: (planning) => dispatch(actions.planning.api.fetchPlanningFiles(planning)),
    setCoverageAddAdvancedMode: (advancedMode) => dispatch(actions.users.setCoverageAddAdvancedMode(advancedMode)),
});

export class PlanningEditorComponent extends React.Component<IProps, IState> {
    dom: {
        slugline: any;
        top: any;
        details: any;
    }

    constructor(props) {
        super(props);

        this.dom = {
            slugline: null,
            top: null,
            details: null,
        };

        this.state = {openCoverageIds: [], uploading: false};

        this.onChange = this.onChange.bind(this);
        this.onDuplicateCoverage = this.onDuplicateCoverage.bind(this);
        this.onCancelCoverage = this.onCancelCoverage.bind(this);
        this.onPlanningDateChange = this.onPlanningDateChange.bind(this);
        this.onAddCoverageToWorkflow = this.onAddCoverageToWorkflow.bind(this);
        this.onAddScheduledUpdateToWorkflow = this.onAddScheduledUpdateToWorkflow.bind(this);
        this.onRemoveAssignment = this.onRemoveAssignment.bind(this);

        this.onAddFiles = this.onAddFiles.bind(this);
        this.onRemoveFile = this.onRemoveFile.bind(this);
        this.onTimeToBeConfirmed = this.onTimeToBeConfirmed.bind(this);
    }

    componentWillUpdate(nextProps) {
        if (getItemId(this.props.item) !== getItemId(nextProps.item)) {
            this.props.fetchPlanningFiles(nextProps.item);
        } else if (get(this.props, 'diff.files') !== get(nextProps, 'diff.files')) {
            this.props.fetchPlanningFiles(nextProps.diff);
        }
    }

    componentWillMount() {
        if (this.props.addNewsItemToPlanning) {
            // In add-to-planning modal
            this.handleAddToPlanningLoading(this.props);
        }

        this.props.fetchPlanningFiles(this.props.item);

        // If the planning item is associated with an event, get its files
        if (this.props.event) {
            this.props.fetchEventFiles(this.props.event);
        }
    }

    handleAddToPlanningLoading(nextProps) {
        if ((nextProps.itemExists && !planningUtils.isLockedForAddToPlanning(nextProps.item)) ||
            (!nextProps.itemExists && get(nextProps, 'diff.coverages.length', 0) > 0)
        ) {
            return;
        }

        let updatedPlanning;

        // If we are creating a new planning item for 'add-to-planning'
        if (!nextProps.itemExists) {
            // Should check here to determine if current item is populated already
            updatedPlanning = planningUtils.createNewPlanningFromNewsItem(
                nextProps.addNewsItemToPlanning,
                nextProps.newsCoverageStatus,
                nextProps.desk,
                get(nextProps, 'addNewsItemToPlanning.version_creator'),
                nextProps.contentTypes);

            this.fillCurrentAgenda(updatedPlanning);
        } else {
            updatedPlanning = cloneDeep(nextProps.item);

            updatedPlanning.coverages.push(planningUtils.createCoverageFromNewsItem(
                nextProps.addNewsItemToPlanning,
                nextProps.newsCoverageStatus,
                nextProps.desk,
                nextProps.user,
                nextProps.contentTypes));
        }

        if (updatedPlanning) {
            updatedPlanning._newsItem = nextProps.addNewsItemToPlanning;
            nextProps.onChangeHandler(null, updatedPlanning);
        }
    }

    fillCurrentAgenda(item) {
        // set the current agenda if agenda is enabled
        if (get(this.props, 'currentAgenda.is_enabled')) {
            item.agendas = [this.props.currentAgenda._id];
        }
    }

    onDuplicateCoverage(coverage, duplicateAs) {
        const coveragePlanning = get(coverage, 'planning');
        let newCoverage = planningUtils.defaultCoverageValues(
            this.props.newsCoverageStatus.find((s) => s.qcode === 'ncostat:int'),
            coveragePlanning,
            this.props.event,
            duplicateAs || coveragePlanning.g2_content_type,
            this.props.defaultDesk,
            this.props.preferredCoverageDesks);

        newCoverage.coverage_id = newCoverage.coverage_id + '-duplicate';
        if (['picture', 'Picture'].includes(newCoverage.planning.g2_content_type) && coverage.planning.xmp_file) {
            newCoverage.planning.xmp_file = coverage.planning.xmp_file;
        }

        if (coverage.workflow_status === WORKFLOW_STATE.CANCELLED) {
            newCoverage.planning.workflow_status_reason = null;
        }

        if (duplicateAs) {
            newCoverage.planning.genre = null;
        }

        let diffCoverages = cloneDeep(this.props.diff.coverages);

        diffCoverages.push(newCoverage);

        this.onChange('coverages', diffCoverages);
    }

    onCancelCoverage(coverage, index, scheduledUpdate, scheduledUpdateIndex) {
        this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.CANCEL_COVERAGE,
            scheduledUpdate, scheduledUpdateIndex);
    }

    onPartialSave(
        coverage: IPlanningCoverageItem,
        index: number,
        action: string,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ) {
        const updates = cloneDeep(get(this.props, 'item'));

        updates.coverages[index] = coverage;

        // Let the ItemEditor component know we're about to perform a partial save
        // This is way the 'save' buttons are disabled while we perform our partial save
        if (!this.props.itemManager.startPartialSave(updates)) {
            return;
        }

        let partialSaveAction;

        if (action === COVERAGES.PARTIAL_SAVE.ADD_TO_WORKFLOW) {
            partialSaveAction = this.props.itemManager.addCoverageToWorkflow;
        } else if (action === COVERAGES.PARTIAL_SAVE.REMOVE_ASSIGNMENT) {
            partialSaveAction = this.props.itemManager.removeAssignment;
        } else if (action == COVERAGES.PARTIAL_SAVE.CANCEL_COVERAGE) {
            partialSaveAction = this.props.itemManager.cancelCoverage;
        } else if (action == COVERAGES.PARTIAL_SAVE.SCHEDULED_UPDATES_ADD_TO_WORKFLOW) {
            partialSaveAction = this.props.itemManager.addScheduledUpdateToWorkflow;
        } else if (action == COVERAGES.PARTIAL_SAVE.SCHEDULED_UPDATES_ADD_TO_WORKFLOW) {
            partialSaveAction = this.props.itemManager.addScheduledUpdateToWorkflow;
        }

        partialSaveAction(this.props.item, coverage, index, scheduledUpdate, scheduledUpdateIndex);
    }

    onAddCoverageToWorkflow(coverage, index) {
        this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.ADD_TO_WORKFLOW);
    }

    onAddScheduledUpdateToWorkflow(coverage, coverageIndex, scheduledUpdate, index) {
        this.onPartialSave(coverage, coverageIndex, COVERAGES.PARTIAL_SAVE.SCHEDULED_UPDATES_ADD_TO_WORKFLOW,
            scheduledUpdate, index);
    }

    onRemoveAssignment(coverage, index, scheduledUpdate, scheduledUpdateIndex) {
        const forScheduledUpdate = get(scheduledUpdate, 'scheduled_update_id');
        const toRemove = !forScheduledUpdate ? coverage : scheduledUpdate;

        if (!get(toRemove, 'assigned_to.assignment_id')) {
            // Non existing assignment, just remove from autosave
            if (!forScheduledUpdate) {
                this.onChange('coverages[' + index + '].assigned_to', {});
            } else {
                this.onChange(`coverages[${index}].scheduled_updates[${scheduledUpdateIndex}].assigned_to`, {});
            }
        } else {
            delete toRemove.assigned_to;
            this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.REMOVE_ASSIGNMENT);
        }
    }

    onChange(field, value, planningFormEdited = true) {
        let valueToUpdate = value;

        if (field === 'agendas') {
            valueToUpdate = value.map((agenda) => agenda._id);
        }

        if (field === 'urgency') {
            valueToUpdate = get(value, 'qcode', null);
        }

        if (field.match(/^coverages\[/)) {
            const {newsCoverageStatus} = this.props;

            // If there is an assignment and coverage status not planned,
            // change it to 'planned'
            if (newsCoverageStatus.length > 0
                && get(value, 'news_coverage_status.qcode') !== newsCoverageStatus[0].qcode
                && !!get(value, 'assigned_to.desk')
            ) {
                valueToUpdate = {
                    ...value,
                    news_coverage_status: this.props.newsCoverageStatus[0],
                };
            }

            if (field.match(/g2_content_type$/) && value === 'text' && this.props.defaultDesk) {
                const coverageStr = field.substr(0, field.indexOf('.'));
                let existingCoverage = {...get(this.props, `diff.${coverageStr}`)};

                if (get(existingCoverage, 'assigned_to.desk') !== this.props.defaultDesk._id) {
                    existingCoverage.planning.g2_content_type = value;
                    this.assignCoverageToDefaultDesk(existingCoverage);
                    this.props.onChangeHandler(coverageStr, existingCoverage);
                    return;
                }
            }
        }

        this.props.onChangeHandler(field, valueToUpdate, planningFormEdited);
    }

    componentWillReceiveProps(nextProps) {
        if (eventUtils.shouldFetchFilesForEvent(nextProps.event)) {
            this.props.fetchEventFiles(nextProps.event);
        }

        // No need for partial save features if the editor is in read-only mode
        if (this.props.readOnly === true) {
            return;
        } else if (this.props.addNewsItemToPlanning && !isExistingItem(this.props.item) &&
            get(nextProps, 'diff.coverages.length', 0) === 0) {
            this.handleAddToPlanningLoading(nextProps);
            return;
        } else if (!isSameItemId(nextProps.item, this.props.item) || nextProps.submitting) {
            return;
        }

        // if the assignment associated with the planning item are modified
        const originalCoverages = get(this.props, 'original.coverages') || [];
        const updatedCoverages = get(nextProps, 'original.coverages') || [];

        if (get(originalCoverages, 'length', 0) < 0) {
            return;
        }

        let updates = {};

        originalCoverages.forEach((original) => {
            // Push notification updates from 'assignment' workflow changes
            const index = updatedCoverages.findIndex((c) => c.coverage_id === original.coverage_id);
            let covUpdates = index >= 0 ? updatedCoverages[index] : null;

            if (!covUpdates) {
                return;
            }

            if (isEqual(covUpdates.assigned_to, original.assigned_to)) {
                // If assignment has not changed
                return;
            }

            updates[`coverages[${index}]`] = covUpdates;
        });

        if (get(this.props, 'original._etag') && get(nextProps, 'original._etag') &&
            this.props.original._etag !== nextProps.original._etag) {
            // Probably cancel-all-coverages
            updates._etag = nextProps.original._etag;
        }

        if (!isEmpty(updates)) {
            this.props.itemManager.finalisePartialSave(updates, false);
        }
    }

    componentDidMount() {
        if (!get(this.props, 'navigation.scrollToViewItem')) {
            this.dom.slugline.focus();
            var tempValue = get(this.dom.slugline, 'value', '');

            this.dom.slugline.value = '';
            this.dom.slugline.value = tempValue;
        }
    }

    componentDidUpdate(prevProps) {
        // If item changed or it got locked for editing
        if (!isSameItemId(prevProps.item, this.props.item) ||
            (!get(prevProps, 'diff.lock_user') && get(this.props, 'diff.lock_user'))) {
            this.dom.slugline.focus();
        }

        if (get(prevProps, 'navigation.scrollToViewItem') !== get(this.props, 'navigation.scrollToViewItem')) {
            // scroll to new position
            if (editorMenuUtils.forceScroll(this.props.navigation, 'planning')) {
                this.dom.top.scrollIntoView();
            }
        }
    }

    onPlanningDateChange(field, value) {
        let changes = {planning_date: value};

        if (field.indexOf('.time') >= 0) {
            changes[TO_BE_CONFIRMED_FIELD] = false;
        }

        this.props.onChangeHandler(changes, null);
    }

    onTimeToBeConfirmed() {
        this.onChange(TO_BE_CONFIRMED_FIELD, true);
    }

    assignCoverageToDefaultDesk(coverage) {
        if (!coverage.assigned_to || isEmpty(coverage.assigned_to)) {
            coverage.assigned_to = {desk: this.props.defaultDesk._id};
        } else {
            coverage.assigned_to.desk = this.props.defaultDesk._id;
            const deskMembers = get(this.props, 'defaultDesk.members', []).map((m) => m.user);

            // If the user does not belong to default desk, remove the user
            if (coverage.assigned_to.user && !deskMembers.includes(coverage.assigned_to.user)) {
                coverage.assigned_to.user = null;
            }
        }
    }

    onAddFiles(fileList) {
        const files = Array.from(fileList).map((f) => [f]);

        this.setState({uploading: true});
        this.props.uploadFiles(files)
            .then((newFiles) => {
                this.props.onChangeHandler('files',
                    [
                        ...get(this.props, 'diff.files', []),
                        ...newFiles.map((f) => f._id),
                    ]);
                this.setState({uploading: false});
            }, () => {
                this.props.notifyValidationErrors('Failed to upload files');
                this.setState({uploading: false});
            });
    }

    onRemoveFile(file) {
        const promise = !get(this.props, 'item.files', []).includes(file._id) ?
            this.props.removeFile(file) : Promise.resolve();

        promise.then(() =>
            this.props.onChangeHandler('files', get(this.props, 'diff.files', []).filter((f) => f !== file._id))
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            itemExists,
            diff,
            event,
            locators,
            languages,
            categories,
            subjects,
            users,
            defaultDesk,
            desks,
            agendas,
            readOnly,
            urgencies,
            newsCoverageStatus,
            contentTypes,
            genres,
            coverageProviders,
            priorities,
            keywords,
            addNewsItemToPlanning,
            submitFailed,
            dirty,
            errors,
            planningProfile,
            coverageProfile,
            lockedItems,
            navigation,
            customVocabularies,
            files,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            setCoverageDefaultDesk,
            preferredCoverageDesks,
            inModalView,
            planningAllowScheduledUpdates,
        } = this.props;

        const agendaValues = cloneDeep(get(diff, 'agendas', [])
            .map((agendaId) => agendas.find((a) => a._id === agendaId)));

        agendaValues.forEach((agenda) => {
            agenda.name = planningUtils.formatAgendaName(agenda);
        });

        const enabledAgendas = agendas.filter((agenda) => get(agenda, 'is_enabled', true));

        const urgencyQcode = get(diff, 'urgency') || null;
        const urgency = getItemInArrayById(urgencies, urgencyQcode, 'qcode');

        // Read-only if
        // 1 - it is supposed to be readOnly by parent props
        // 2 - for add-to-planning and existing planning item
        const updatedReadOnly = readOnly || (!!addNewsItemToPlanning && itemExists);

        let maxCoverageCount = 0;

        if (addNewsItemToPlanning) {
            if (!itemExists) {
                maxCoverageCount = 1;
            } else {
                maxCoverageCount = get(item, 'coverages.length', 0) + 1;
            }
        }

        const fieldProps = {
            item: item,
            diff: diff,
            readOnly: updatedReadOnly,
            onChange: this.onChange,
            formProfile: planningProfile,
            errors: errors,
            showErrors: submitFailed,
        };

        const popupProps = {
            onPopupOpen,
            onPopupClose,
        };

        const getCountOfProperty = (propertyName) => {
            const count = get(this.props, `diff.${propertyName}.length`, 0);

            return count > 0 ? count : null;
        };

        const detailsErrored = some(toggleDetails, (field) => !!get(errors, field));
        const onFocusPlanning = editorMenuUtils.onItemFocus(this.props.navigation, 'planning');
        const onFocusDetails = editorMenuUtils.onItemFocus(this.props.navigation, 'details');
        const onFocusFiles = editorMenuUtils.onItemFocus(this.props.navigation, 'files');
        // eslint-disable-next-line max-len
        const forwardPlanningTitle = gettext('When active, assigned coverages for the Planning item will not be automatically added to workflow');

        return (
            <div ref={(node) => this.dom.top = node}>
                <PlanningEditorHeader
                    item={diff}
                    users={users}
                    event={event}
                />

                <ContentBlock>
                    <Field
                        component={SelectInput}
                        field="language"
                        label={gettext('Language')}
                        defaultValue={getUsersDefaultLanguage()}
                        options={languages}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                        labelField={'name'}
                        valueAsString={true}
                        enabled={planningProfile?.editor?.language?.enabled}
                    />

                    <Field
                        component={TextInput}
                        field="slugline"
                        label={gettext('Slugline')}
                        refNode={(node) => this.dom.slugline = node}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={TextInput}
                        field="headline"
                        label={gettext('Headline')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={DateTimeInput}
                        field="planning_date"
                        label={gettext('Planning Date')}
                        defaultValue={null}
                        row={false}
                        {...fieldProps}
                        onChange={this.onPlanningDateChange}
                        onFocus={onFocusPlanning}
                        {...popupProps}
                        showToBeConfirmed
                        toBeConfirmed={get(diff, TO_BE_CONFIRMED_FIELD)}
                        onToBeConfirmed={this.onTimeToBeConfirmed}
                    />

                    <Field
                        component={TextAreaInput}
                        field="description_text"
                        label={gettext('Description')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={ExpandableTextAreaInput}
                        field="internal_note"
                        label={gettext('Internal Note')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="place"
                        label={gettext('Place')}
                        options={locators}
                        defaultValue={[]}
                        groupField="group"
                        {...fieldProps}
                        onFocus={onFocusDetails}
                        popupContainer={popupContainer}
                        language={diff.language}
                        {...popupProps}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="agendas"
                        label={gettext('Agenda')}
                        options={enabledAgendas}
                        valueKey="_id"
                        value={agendaValues}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                        popupContainer={popupContainer}
                        language={diff.language}
                        {...popupProps}
                    />

                    <ToggleBox
                        title={gettext('Details')}
                        isOpen={editorMenuUtils.isOpen(navigation, 'details')}
                        onClose={editorMenuUtils.onItemClose(navigation, 'details')}
                        onOpen={editorMenuUtils.onItemOpen(navigation, 'details')}
                        forceScroll={editorMenuUtils.forceScroll(navigation, 'details')}
                        scrollInView={true}
                        invalid={detailsErrored && (dirty || submitFailed)}
                        paddingTop={!!onFocusDetails}
                    >
                        <Field
                            component={TextAreaInput}
                            field="ednote"
                            label={gettext('Ed Note')}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="anpa_category"
                            label={gettext('ANPA Category')}
                            options={categories}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                            popupContainer={popupContainer}
                            language={diff.language}
                            {...popupProps}
                        />

                        {get(planningProfile, 'editor.subject.enabled') && (
                            <Field
                                component={SelectMetaTermsInput}
                                field="subject"
                                label={gettext('Subject')}
                                options={subjects}
                                defaultValue={[]}
                                {...fieldProps}
                                onFocus={onFocusDetails}
                                popupContainer={popupContainer}
                                language={diff.language}
                                {...popupProps}
                            />
                        )}

                        <CustomVocabulariesFields
                            customVocabularies={customVocabularies}
                            fieldProps={fieldProps}
                            onFocusDefails={onFocusDetails}
                            formProfile={planningProfile}
                            popupProps={popupProps}
                            popupContainer={popupContainer}
                        />

                        <Field
                            component={ColouredValueInput}
                            field="urgency"
                            label={gettext('Urgency')}
                            value={urgency}
                            options={urgencies}
                            iconName="urgency-label"
                            defaultValue={null}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                            {...popupProps}
                        />

                        {!get(item, 'pubstatus') && (
                            <Field
                                component={ToggleInput}
                                field="flags.marked_for_not_publication"
                                label={gettext('Not for Publication')}
                                labelLeft={true}
                                defaultValue={false}
                                title={gettext('When active, the Planning item will not be publishable')}
                                {...fieldProps}
                                onFocus={onFocusDetails}
                            />
                        )}
                        {appConfig.planning_auto_assign_to_workflow && (
                            <Field
                                component={ToggleInput}
                                field="flags.overide_auto_assign_to_workflow"
                                label={gettext('Forward Planning')}
                                title={forwardPlanningTitle}
                                labelLeft={true}
                                defaultValue={false}
                                {...fieldProps}
                                onFocus={onFocusDetails}
                            />
                        )}
                    </ToggleBox>

                    {get(planningProfile, 'editor.files.enabled') && (
                        <ToggleBox
                            title={gettext('Attached Files')}
                            isOpen={editorMenuUtils.isOpen(navigation, 'files')}
                            onClose={editorMenuUtils.onItemClose(navigation, 'files')}
                            onOpen={editorMenuUtils.onItemOpen(navigation, 'files')}
                            scrollInView={true}
                            hideUsingCSS={true} // hideUsingCSS so the file data is kept on hide/show
                            invalid={!!errors.files && (dirty || submitFailed)}
                            forceScroll={editorMenuUtils.forceScroll(navigation, 'files')}
                            paddingTop={!!onFocusFiles}
                            badgeValue={getCountOfProperty('files')}
                        >
                            <div className={this.state.uploading ? 'sd-loader' : ''}>
                                { !this.state.uploading && (
                                    <Field
                                        component={FileInput}
                                        field="files"
                                        createLink={getFileDownloadURL}
                                        defaultValue={[]}
                                        {...fieldProps}
                                        onFocus={onFocusFiles}
                                        files={files}
                                        onAddFiles={this.onAddFiles}
                                        onRemoveFile={this.onRemoveFile}
                                    />
                                )}
                            </div>
                        </ToggleBox>
                    )}
                </ContentBlock>

                {event && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Associated Event')}
                    </h3>
                )}

                {event && (
                    <ContentBlock>
                        <EventMetadata
                            event={event}
                            lockedItems={lockedItems}
                            navigation={navigation}
                            createUploadLink={getFileDownloadURL}
                            files={files}
                            tabEnabled
                        />
                    </ContentBlock>
                )}

                <Field
                    component={CoverageArrayInput}
                    row={false}
                    field="coverages"
                    defaultDesk={defaultDesk}
                    users={users}
                    desks={desks}
                    newsCoverageStatus={newsCoverageStatus}
                    contentTypes={contentTypes}
                    genres={genres}
                    coverageProviders={coverageProviders}
                    priorities={priorities}
                    keywords={keywords}
                    onDuplicateCoverage={this.onDuplicateCoverage}
                    onCancelCoverage={this.onCancelCoverage}
                    onAddCoverageToWorkflow={this.onAddCoverageToWorkflow}
                    onAddScheduledUpdateToWorkflow={this.onAddScheduledUpdateToWorkflow}
                    onRemoveAssignment={this.onRemoveAssignment}
                    readOnly={readOnly}
                    maxCoverageCount={maxCoverageCount}
                    addOnly={!!addNewsItemToPlanning}
                    addNewsItemToPlanning={addNewsItemToPlanning}
                    originalCount={get(item, 'coverages', []).length}
                    defaultValue={[]}
                    {...fieldProps}
                    formProfile={coverageProfile}
                    navigation={navigation}
                    popupContainer={popupContainer}
                    {...popupProps}
                    setCoverageDefaultDesk={setCoverageDefaultDesk}
                    preferredCoverageDesks={preferredCoverageDesks}
                    useLocalNavigation={!inModalView}
                    event={event}
                    planningAllowScheduledUpdates={planningAllowScheduledUpdates}
                    coverageAddAdvancedMode={this.props.coverageAddAdvancedMode}
                    setCoverageAddAdvancedMode={this.props.setCoverageAddAdvancedMode}
                    files={files}
                    createUploadLink={getFileDownloadURL}
                    uploadFiles={this.props.uploadFiles}
                    notifyValidationErrors={this.props.notifyValidationErrors}
                />
            </div>
        );
    }
}

export const PlanningEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningEditorComponent);
