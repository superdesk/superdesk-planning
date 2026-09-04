import * as React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get, isEqual, uniqBy} from 'lodash';

import {appConfig} from 'appConfig';
import {
    EDITOR_TYPE,
    IAgenda,
    IPlanningContentProfile,
    IEventItem,
    IFile,
    IFormItemManager,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningFormProfile,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    ILockedItems,
    ICoverageType,
} from '../../../interfaces';
import {IArticle, IDesk, IUser, IVocabularyItem} from 'superdesk-api';
import {planningApi} from '../../../superdeskApi';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {planningUtils, eventUtils, lockUtils} from '../../../utils';

import {EditorForm} from '../../Editor/EditorForm';
import {PlanningEditorHeader} from './PlanningEditorHeader';
import planningActions from '../../../actions/planning/api';

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

    event?: IEventItem; // TAG: MULTIPLE_PRIMARY_EVENTS
    events?: Array<IEventItem>;
    addNewsItemToPlanning?: IArticle;
    inModalView: boolean;
    activeNav?: string;
    editorType: EDITOR_TYPE;
    showAllLanguages: boolean;
    language: IVocabularyItem['qcode'];

    coverageProfilesMap: Record<ICoverageType, IPlanningContentProfile>;

    // State
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    currentAgenda?: IAgenda;
    desk: IDesk['_id'];
    user: IUser['_id'];
    contentTypes: Array<IG2ContentType>;
    defaultDesk?: IDesk;
    files: Array<IFile>;
    lockedItems: ILockedItems;

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
}

interface IState {
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
}

const mapStateToProps = (state) => ({
    coverageProfilesMap: selectors.coverageProfiles.getCoverageProfilesMap(state),
    events: selectors.events.storedEvents(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    desk: selectors.general.currentDeskId(state),
    user: selectors.general.currentUserId(state),
    defaultDesk: selectors.general.defaultDesk(state),
    files: selectors.general.files(state),
    contentTypes: selectors.general.contentTypes(state),
    formProfile: selectors.forms.planningProfile(state),
    lockedItems: selectors.locks.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    fetchPlanningFiles: (planning) => dispatch(planningActions.fetchPlanningFiles(planning)),
    uploadFiles: (files) => dispatch(planningActions.uploadFiles({files: files})),
    removeFile: (file) => dispatch(planningActions.removeFile(file)),
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
    }

    componentDidMount() {
        if (this.props.addNewsItemToPlanning != null) {
            // In add-to-planning modal
            this.handleAddToPlanningLoading();
        }

        this.props.fetchPlanningFiles({
            ...this.props.item,
            ...this.props.diff,
        });

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

        if (
            !this.props.readOnly &&
            this.props.addNewsItemToPlanning &&
            !this.props.itemExists &&
            this.props.diff?.coverages?.length === 0
        ) {
            this.handleAddToPlanningLoading();
        }
    }

    handleAddToPlanningLoading() {
        if ((this.props.itemExists && !lockUtils.isLockedForAddToPlanning(this.props.item, this.props.lockedItems)) ||
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
                this.props.contentTypes,
                this.props.coverageProfilesMap,
            );

            this.fillCurrentAgenda(updatedPlanning);
        } else {
            updatedPlanning = cloneDeep(this.props.item);

            updatedPlanning.coverages.push(
                planningUtils.createCoverageFromNewsItem(
                    this.props.addNewsItemToPlanning,
                    this.props.newsCoverageStatus,
                    this.props.desk,
                    this.props.contentTypes,
                    this.props.coverageProfilesMap,
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

    onCoverageChange(field: string, value: any, planningFormEdited: boolean = true) {
        this.props.onChangeHandler(field, value, planningFormEdited);

        if (field === 'coverages') {
            // Flush the autosave so the Redux Store get's updated with the
            // latest autosave item
            // This allows the CoveragesBookmark component to update quicker
            planningApi.editor(this.props.editorType).autosave.flushAutosave();
        }
    }

    onPlanningDateChange(fieldOrValue: string | {[key: string]: any}, value?: any) {
        if (typeof fieldOrValue === 'string') {
            let changes: Partial<IPlanningItem> = {planning_date: value};

            if (fieldOrValue.indexOf('.time') >= 0) {
                changes._time_to_be_confirmed = false;
            }

            this.props.onChangeHandler(changes, null);
        } else {
            this.props.onChangeHandler(fieldOrValue, value);
        }
    }

    onTimeToBeConfirmed() {
        this.props.onChangeHandler('_time_to_be_confirmed', true);
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
        const editor = planningApi.editor(this.props.editorType);

        if (this.props.addNewsItemToPlanning != null) {
            maxCoverageCount = !this.props.itemExists ?
                1 :
                (this.props.item?.coverages?.length ?? 0) + 1;
        }

        const allRelatedEvents = uniqBy([
            ...(this.props.diff._unsaved_related_events ?? []),
            ...(this.props.diff.related_events ?? []),
        ], (x) => x._id);

        const fullEvents = allRelatedEvents.map((x) => {
            const fromEventsResource = this.props.events[x._id];

            if (fromEventsResource != null) {
                return fromEventsResource;
            }

            return x;
        });

        return (
            <EditorForm
                itemManager={this.props.itemManager}
                defaultGroup={'title'}
                header={this.renderHeader()}
                activeNav={this.props.activeNav}
                editorType={this.props.editorType}
                globalProps={{
                    item: this.props.diff,
                    language: this.props.language,
                    onChange: this.props.onChangeHandler,
                    errors: this.props.errors,
                    showErrors: this.props.submitFailed,
                    disabled: this.props.readOnly || (
                        this.props.addNewsItemToPlanning != null &&
                        this.props.itemExists
                    ),
                    profile: this.props.formProfile,
                    editorType: this.props.editorType,
                    setMainLanguage: editor.form.setMainLanguage,
                    toggleAllLanguages: editor.form.toggleAllLanguages,
                    showAllLanguages: this.props.showAllLanguages,
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
                    marked_for_not_publication: {
                        enabled: this.props.diff?.pubstatus == null,
                    },
                    overide_auto_assign_to_workflow: {
                        enabled: appConfig.planning_auto_assign_to_workflow
                    },
                    files: {
                        uploadFiles: this.props.uploadFiles,
                        removeFile: this.props.removeFile,
                        files: this.props.files,
                    },
                    associated_event: {
                        updateEventItem: editor.item.planning.updateEventItem,
                        unlinkEvent: editor.item.planning.unlinkEvent,
                        field: 'related_events',
                        events: fullEvents,
                    },
                    location: {
                        enableExternalSearch: true,
                        storeAsArray: true,
                    },
                    coverages: {
                        onChange: this.onCoverageChange,
                        addNewsItemToPlanning: this.props.addNewsItemToPlanning,
                        useLocalNavigation: !this.props.inModalView,
                        navigation: this.props.navigation,
                        maxCoverageCount: maxCoverageCount,
                        disabled: this.props.readOnly,
                        addOnly: this.props.addNewsItemToPlanning != null,
                        originalCount: this.props.item?.coverages?.length ?? 0,
                        message: this.props.message,
                        event: this.props.event, // TAG: MULTIPLE_PRIMARY_EVENTS
                        defaultValue: [],
                        files: this.props.files,
                        uploadFiles: this.props.uploadFiles,
                        removeFile: this.props.removeFile,
                        notifyValidationErrors: this.props.notifyValidationErrors,
                        onPopupOpen: this.props.onPopupOpen,
                        onPopupClose: this.props.onPopupClose,
                        getRef: (field, value: IPlanningCoverageItem) => (
                            editor.item.planning.getCoverageFieldDomRef(value.coverage_id)
                        ),
                        includeScheduledUpdates: true,
                        language: this.props.language,
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
