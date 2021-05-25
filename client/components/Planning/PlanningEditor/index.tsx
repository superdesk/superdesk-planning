import * as React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get, isEqual} from 'lodash';

import {getUserInterfaceLanguage, appConfig} from 'appConfig';
import {
    EDITOR_TYPE,
    IAgenda,
    ICoverageScheduledUpdate,
    IEventItem,
    IFile,
    IFormItemManager,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningFormProfile,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
} from '../../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {planningApi} from '../../../superdeskApi';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {planningUtils, eventUtils} from '../../../utils';

import {EditorForm} from '../../Editor/EditorForm';
import {PlanningEditorHeader} from './PlanningEditorHeader';
import {COVERAGES} from '../../../constants';

interface IProps {
    original?: IPlanningItem;
    item: IPlanningItem;
    diff: Partial<IPlanningItem>;
    itemExists: boolean;
    readOnly: boolean;
    formProfile: IPlanningFormProfile;
    errors: {[key: string]: any};
    submitting: boolean;
    submitFailed: boolean;
    itemManager: IFormItemManager;

    event?: IEventItem;
    addNewsItemToPlanning?: IArticle;
    inModalView: boolean;
    activeNav?: string;
    editorType: EDITOR_TYPE;

    // State
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    currentAgenda?: IAgenda;
    desk: IDesk['_id'];
    user: IUser['_id'];
    contentTypes: Array<IG2ContentType>;
    defaultDesk?: IDesk;
    preferredCoverageDesks: {[key: string]: string};
    files: Array<IFile>;

    onChangeHandler(
        field: string | {[key: string]: any},
        value: any,
        updateDirtyFlag?: boolean, // defaults to true
        saveAutosave?: boolean // defaults to true
    ): void;
    onPopupOpen(): void;
    onPopupClose(): void;
    notifyValidationErrors(errors: Array<string>): void;

    // Dispatches
    fetchEventFiles(event: IEventItem): void;
    fetchPlanningFiles(item: IPlanningItem): Promise<void>;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    removeFile(file: IFile): Promise<void>;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    setCoverageAddAdvancedMode(enabled: boolean): Promise<void>;
}

interface IState {
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
}

const mapStateToProps = (state) => ({
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    desk: selectors.general.currentDeskId(state),
    user: selectors.general.currentUserId(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: get(selectors.general.preferredCoverageDesks(state), 'desks'),
    files: selectors.general.files(state),
    contentTypes: selectors.general.contentTypes(state),
    formProfile: selectors.forms.planningProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    fetchPlanningFiles: (planning) => dispatch(actions.planning.api.fetchPlanningFiles(planning)),
    uploadFiles: (files) => dispatch(actions.planning.api.uploadFiles({files: files})),
    removeFile: (file) => dispatch(actions.planning.api.removeFile(file)),
    setCoverageDefaultDesk: (coverage) => dispatch(actions.users.setCoverageDefaultDesk(coverage)),
    setCoverageAddAdvancedMode: (advancedMode) => dispatch(actions.users.setCoverageAddAdvancedMode(advancedMode)),
});

class PlanningEditorComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            openCoverageIds: [],
        };

        this.onCoverageChange = this.onCoverageChange.bind(this);
        this.onPlanningDateChange = this.onPlanningDateChange.bind(this);
        this.onTimeToBeConfirmed = this.onTimeToBeConfirmed.bind(this);
        this.onDuplicateCoverage = this.onDuplicateCoverage.bind(this);
        this.onCancelCoverage = this.onCancelCoverage.bind(this);
        this.onAddCoverageToWorkflow = this.onAddCoverageToWorkflow.bind(this);
        this.onAddScheduledUpdateToWorkflow = this.onAddScheduledUpdateToWorkflow.bind(this);
        this.onRemoveAssignment = this.onRemoveAssignment.bind(this);
    }

    componentDidMount() {
        if (this.props.addNewsItemToPlanning != null) {
            // In add-to-planning modal
            this.handleAddToPlanningLoading();
        }

        this.props.fetchPlanningFiles(this.props.item);

        if (this.props.event != null) {
            this.props.fetchEventFiles(this.props.event);
        }
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
        const prevItemId = prevProps.item?._id;
        const currentItemId = this.props.item?._id;

        if (currentItemId !== prevItemId || this.props.diff?.files != prevProps.diff?.files) {
            this.props.fetchPlanningFiles({
                ...this.props.item,
                ...this.props.diff,
            });
        }

        if (eventUtils.shouldFetchFilesForEvent(this.props.event)) {
            this.props.fetchEventFiles(this.props.event);
        }

        // No need for partial save features if the editor is in read-only mode
        if (this.props.readOnly) {
            return;
        } else if (
            this.props.addNewsItemToPlanning &&
            !this.props.itemExists &&
            this.props.diff?.coverages?.length === 0
        ) {
            this.handleAddToPlanningLoading();
            return;
        } else if (currentItemId !== prevItemId || this.props.submitting) {
            return;
        }

        // If the assignment associated with the planning item are modified
        const originalCoverages = prevProps.original?.coverages || [];
        const updatedCoverages = this.props.original?.coverages || [];

        if (!originalCoverages.length) {
            return;
        }

        let updates: {[key: string]: any} = {};

        originalCoverages.forEach((original) => {
            // Push notification updates from 'assignment' workflow changes
            const index = updatedCoverages.findIndex(
                (c) => c.coverage_id === original.coverage_id
            );
            const covUpdates = index >= 0 ?
                updatedCoverages[index] :
                null;

            if (covUpdates == null) {
                return;
            }

            if (isEqual(covUpdates.assigned_to, original.assigned_to)) {
                // If assignment has not changed
                return;
            }

            updates[`coverages[${index}]`] = covUpdates;
        });

        if (prevProps.original?._etag != null &&
            this.props.original?._etag != null &&
            prevProps.original._etag !== this.props.original._etag
        ) {
            // Update the `_etag` if it has changed
            updates._etag = this.props.original._etag;
        }

        if (Object.keys(updates).length) {
            this.props.itemManager.finalisePartialSave(updates, false);
        }
    }

    handleAddToPlanningLoading() {
        if ((this.props.itemExists && !planningUtils.isLockedForAddToPlanning(this.props.item)) ||
            (!this.props.itemExists && get(this.props, 'diff.coverages.length', 0) > 0)
        ) {
            return;
        }

        let updatedPlanning: DeepPartial<IPlanningItem>;

        // If we are creating a new planning item for 'add-to-planning'
        if (!this.props.itemExists) {
            // Should check here to determine if current item is populated already
            updatedPlanning = planningUtils.createNewPlanningFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                this.props.addNewsItemToPlanning?.version_creator,
                this.props.contentTypes
            );

            this.fillCurrentAgenda(updatedPlanning);
        } else {
            updatedPlanning = cloneDeep(this.props.item);

            updatedPlanning.coverages.push(
                planningUtils.createCoverageFromNewsItem(
                    this.props.addNewsItemToPlanning,
                    this.props.newsCoverageStatus,
                    this.props.desk,
                    this.props.user,
                    this.props.contentTypes
                )
            );
        }

        if (updatedPlanning) {
            this.props.onChangeHandler(null, updatedPlanning);
        }
    }

    fillCurrentAgenda(item: DeepPartial<IPlanningItem>) {
        // set the current agenda if agenda is enabled
        if (this.props.currentAgenda?.is_enabled) {
            item.agendas = [this.props.currentAgenda._id];
        }
    }

    onDuplicateCoverage(coverage: IPlanningCoverageItem, duplicateAs: IG2ContentType['qcode']) {
        const coverages = planningUtils.duplicateCoverage(
            this.props.diff,
            coverage,
            duplicateAs,
            this.props.event
        );

        this.props.onChangeHandler('coverages', coverages);
    }

    onCoverageChange(field: string, value: any, planningFormEdited: boolean = true) {
        let valueToUpdate = value;

        if (field.match(/^coverages\[/)) {
            const {newsCoverageStatus} = this.props;
            const coverage = value as IPlanningCoverageItem;

            // If there is an assignment and coverage status not planned,
            // change it to 'planned'
            if (newsCoverageStatus.length > 0 &&
                coverage?.news_coverage_status?.qcode !== newsCoverageStatus[0].qcode &&
                coverage?.assigned_to?.desk != null
            ) {
                valueToUpdate = {
                    ...coverage,
                    news_coverage_status: this.props.newsCoverageStatus[0],
                };
            }

            if (field.match(/g2_content_type$/) &&
                value === 'text' &&
                this.props.defaultDesk?._id != null
            ) {
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

        if (field === 'coverages') {
            // Flush the autosave so the Redux Store get's updated with the
            // latest autosave item
            // This allows the CoveragesBookmark component to update quicker
            planningApi.editor(this.props.editorType).autosave.flushAutosave();
        }
    }

    onPlanningDateChange(field, value) {
        let changes: Partial<IPlanningItem> = {planning_date: value};

        if (field.indexOf('.time') >= 0) {
            changes._time_to_be_confirmed = false;
        }

        this.props.onChangeHandler(changes, null);
    }

    onTimeToBeConfirmed() {
        this.props.onChangeHandler('_time_to_be_confirmed', true);
    }

    assignCoverageToDefaultDesk(coverage: DeepPartial<IPlanningCoverageItem>) {
        if (!Object.keys(coverage.assigned_to ?? {}).length) {
            coverage.assigned_to = {desk: this.props.defaultDesk._id};
        } else {
            // TODO: Fix IDesk['members'] type in client-core
            // @ts-ignore
            const deskMembers = (this.props.defaultDesk?.members ?? []).map((m) => m.user);

            coverage.assigned_to.desk = this.props.defaultDesk._id;

            // If the user does not belong to default desk, remove the user
            if (coverage.assigned_to.user && !deskMembers.includes(coverage.assigned_to.user)) {
                coverage.assigned_to.user = null;
            }
        }
    }

    onCancelCoverage(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ) {
        this.onPartialSave(
            coverage,
            index,
            COVERAGES.PARTIAL_SAVE.CANCEL_COVERAGE,
            scheduledUpdate,
            scheduledUpdateIndex
        );
    }

    onAddCoverageToWorkflow(coverage: IPlanningCoverageItem, index: number) {
        this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.ADD_TO_WORKFLOW);
    }

    onAddScheduledUpdateToWorkflow(
        coverage: IPlanningCoverageItem,
        coverageIndex: number,
        scheduledUpdate: ICoverageScheduledUpdate,
        index: number
    ) {
        this.onPartialSave(
            coverage,
            coverageIndex,
            COVERAGES.PARTIAL_SAVE.SCHEDULED_UPDATES_ADD_TO_WORKFLOW,
            scheduledUpdate,
            index
        );
    }

    onRemoveAssignment(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate: ICoverageScheduledUpdate,
        scheduledUpdateIndex: number
    ) {
        const forScheduledUpdate = get(scheduledUpdate, 'scheduled_update_id');
        const toRemove = !forScheduledUpdate ? coverage : scheduledUpdate;

        if (!get(toRemove, 'assigned_to.assignment_id')) {
            // Non existing assignment, just remove from autosave
            if (!forScheduledUpdate) {
                this.onCoverageChange(`coverages[${index}].assigned_to`, {});
            } else {
                this.onCoverageChange(`coverages[${index}].scheduled_updates[${scheduledUpdateIndex}].assigned_to`, {});
            }
        } else {
            delete toRemove.assigned_to;
            this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.REMOVE_ASSIGNMENT);
        }
    }

    onPartialSave(
        coverage: IPlanningCoverageItem,
        index: number,
        action: string,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ) {
        const updates = cloneDeep(this.props.item);

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
        }

        partialSaveAction(this.props.item, coverage, index, scheduledUpdate, scheduledUpdateIndex);
    }

    renderHeader() {
        return !this.props.itemExists ? null : (
            <PlanningEditorHeader
                item={this.props.item}
                event={this.props.event}
            />
        );
    }

    render() {
        let maxCoverageCount = 0;

        if (this.props.addNewsItemToPlanning != null) {
            maxCoverageCount = !this.props.itemExists ?
                1 :
                (this.props.item?.coverages?.length ?? 0) + 1;
        }

        return (
            <EditorForm
                itemManager={this.props.itemManager}
                defaultGroup={'title'}
                header={this.renderHeader()}
                activeNav={this.props.activeNav}
                editorType={this.props.editorType}
                globalProps={{
                    item: this.props.diff,
                    language: this.props.diff.language ?? getUserInterfaceLanguage(),
                    onChange: this.props.onChangeHandler,
                    errors: this.props.errors,
                    showErrors: this.props.submitFailed,
                    disabled: this.props.readOnly || (
                        this.props.addNewsItemToPlanning != null &&
                        this.props.itemExists
                    ),
                    profile: this.props.formProfile,
                }}
                schema={this.props.formProfile.schema}
                fieldProps={{
                    language: {
                        clearable: false,
                    },
                    planning_date: {
                        onChange: this.onPlanningDateChange,
                        onToBeConfirmed: this.onTimeToBeConfirmed,
                    },
                    urgency: {
                        valueAsString: true,
                    },
                    'flags.marked_for_not_publication': {
                        enabled: this.props.diff?.pubstatus == null,
                    },
                    'flags.overide_auto_assign_to_workflow': {
                        enabled: appConfig.planning_auto_assign_to_workflow
                    },
                    files: {
                        uploadFiles: this.props.uploadFiles,
                        removeFile: this.props.removeFile,
                        files: this.props.files,
                    },
                    associated_event: {
                        event: this.props.event,
                    },
                    coverages: {
                        onChange: this.onCoverageChange,
                        addNewsItemToPlanning: this.props.addNewsItemToPlanning,
                        useLocalNavigation: !this.props.inModalView,
                        navigation: this.props.navigation,
                        maxCoverageCount: maxCoverageCount,
                        addOnly: this.props.addNewsItemToPlanning != null,
                        originalCount: this.props.item?.coverages?.length ?? 0,
                        message: this.props.message,
                        event: this.props.event,
                        preferredCoverageDesks: this.props.preferredCoverageDesks,
                        setCoverageDefaultDesk: this.props.setCoverageDefaultDesk,
                        setCoverageAddAdvancedMode: this.props.setCoverageAddAdvancedMode,
                        onDuplicateCoverage: this.onDuplicateCoverage,
                        onCancelCoverage: this.onCancelCoverage,
                        onAddCoverageToWorkflow: this.onAddCoverageToWorkflow,
                        onAddScheduledUpdateToWorkflow: this.onAddScheduledUpdateToWorkflow,
                        onRemoveAssignment: this.onRemoveAssignment,
                        defaultValue: [],
                        uploadFiles: this.props.uploadFiles,
                        notifyValidationErrors: this.props.notifyValidationErrors,
                        onPopupOpen: this.props.onPopupOpen,
                        onPopupClose: this.props.onPopupClose,
                        getRef: (field, value: IPlanningCoverageItem) => (
                            planningApi.editor(this.props.editorType)
                                .item.planning.getCoverageFieldDomRef(value.coverage_id)
                        ),
                    },
                }}
            />
        );
    }
}

export const PlanningEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningEditorComponent);
