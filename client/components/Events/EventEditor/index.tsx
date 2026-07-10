import * as React from 'react';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';
import {
    IEventItem,
    IEventFormProfile,
    IFile,
    IPlanningItem,
    IFormItemManager,
    EDITOR_TYPE,
} from '../../../interfaces';
import {IVocabularyItem} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {EditorForm} from '../../Editor/EditorForm';
import {EventEditorHeader} from './EventEditorHeader';
import {ContentBlock} from '../../UI/SidePanel';
import {RepeatEventSummary} from '../RepeatEventSummary';
import {EventScheduleSummary} from '../EventScheduleSummary';
import {appConfig} from 'appConfig';

interface IProps {
    original?: IEventItem;
    item: IEventItem;
    diff: Partial<IEventItem>;
    itemExists: boolean;
    readOnly: boolean;
    formProfile: IEventFormProfile;
    errors: {[key: string]: any};
    submitting: boolean;
    submitFailed: boolean;
    plannings: Array<IPlanningItem>;
    itemManager: IFormItemManager;
    activeNav?: string;
    inModalView?: boolean;
    editorType: EDITOR_TYPE;
    showAllLanguages: boolean;
    language: IVocabularyItem['qcode'];

    onChangeHandler(field: string | {[key: string]: any}, value?: any): void;
    onPopupOpen(): void;
    onPopupClose(): void;
    fetchEventFiles(event: IEventItem): void;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    removeFile(file: IFile): Promise<void>;
    notifyValidationErrors(errors: Array<string>): void;
}

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event: IEventItem) => {
        dispatch(actions.events.api.fetchEventFiles(event));
    },
    uploadFiles: (files) => dispatch(actions.events.api.uploadFiles({files: files})),
    removeFile: (file) => dispatch(actions.events.api.removeFile(file)),
});

class EventEditorComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onDatesChanged = this.onDatesChanged.bind(this);
    }

    componentDidMount() {
        this.props.fetchEventFiles({
            ...this.props.item,
            ...this.props.diff,
        });
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any) {
        const prevItemId = prevProps.item?._id;
        const currentItemId = this.props.item?._id;

        if (currentItemId !== prevItemId || this.props.diff?.files != prevProps.diff?.files) {
            this.props.fetchEventFiles({
                ...this.props.item,
                ...this.props.diff,
            });
        }

        const initialValueUpdates: Partial<IEventItem> = {};

        if (!isEqual(this.props.original?.planning_ids, prevProps.original?.planning_ids)) {
            initialValueUpdates.planning_ids = this.props.original?.planning_ids ?? [];
        }

        if (prevProps.original?._etag != null &&
            this.props.original?._etag != null &&
            prevProps.original._etag !== this.props.original._etag
        ) {
            // Keep editor If-Match value current without triggering onChange/autosave side effects.
            const managerState = this.props.itemManager.getState();

            this.props.itemManager.setState({
                initialValues: {
                    ...managerState.initialValues,
                    _etag: this.props.original._etag,
                },
            });
        }

        if (Object.keys(initialValueUpdates).length > 0) {
            this.props.itemManager.forceUpdateInitialValues(initialValueUpdates);
        }
    }

    onDatesChanged(value: {[key: string]: any}) {
        const editor = planningApi.editor(this.props.editorType);

        editor.item.events.onEventDatesChanged({
            start: value['dates.start'],
            end: value['dates.end'],
            tz: value['dates.tz'],
            all_day: value['dates.all_day'],
            no_end_time: value['dates.no_end_time'],
        });

        this.props.onChangeHandler(value);
    }

    renderHeader() {
        const {item, itemExists} = this.props;

        if (!itemExists) {
            return null;
        }

        return (
            <>
                <EventEditorHeader item={item} />
                <ContentBlock padSmall>
                    <EventScheduleSummary
                        event={item}
                        noPadding
                    />
                </ContentBlock>
            </>
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const editor = planningApi.editor(this.props.editorType);

        return (
            <EditorForm
                itemManager={this.props.itemManager}
                defaultGroup={!this.props.itemExists ? 'schedule' : 'description'}
                header={this.renderHeader()}
                activeNav={this.props.activeNav}
                editorType={this.props.editorType}
                globalProps={{
                    item: this.props.diff,
                    language: this.props.language,
                    onChange: this.props.onChangeHandler,
                    errors: this.props.errors,
                    disabled: this.props.readOnly,
                    showErrors: this.props.submitFailed,
                    profile: this.props.formProfile,
                    editorType: this.props.editorType,
                    setMainLanguage: editor.form.setMainLanguage,
                    toggleAllLanguages: editor.form.toggleAllLanguages,
                    showAllLanguages: this.props.showAllLanguages,
                }}
                schema={this.props.formProfile.schema}
                fieldProps={{
                    recurring_rules: {
                        field: 'dates.recurring_rule',
                        defaultValue: {},
                        originalItem: this.props.original,
                    },
                    dates: {
                        required: true,
                        showAllDay: this.props.formProfile.editor.dates.all_day.enabled,
                        showTimeZone: true,
                        enabled: appConfig.planning_event_link_method === 'many_secondary'
                            ? true
                            : !this.props.itemExists,
                        onChange: this.onDatesChanged,
                    },
                    language: {
                        clearable: false,
                    },
                    reference: {
                        label: gettext('External Reference'),
                    },
                    event_contact_info: {
                        field: 'event_contact_info',
                    },
                    location: {
                        enableExternalSearch: true,
                        storeAsArray: true,
                    },
                    name: {
                        label: gettext('Event Name'),
                    },
                    files: {
                        uploadFiles: this.props.uploadFiles,
                        removeFile: this.props.removeFile,
                    },
                    related_plannings: {
                        getRef: (value: DeepPartial<IPlanningItem>) => (
                            editor.item.events.getRelatedPlanningDomRef(value._id)
                        ),
                        addPlanningItem: editor.item.events.addPlanningItem,
                        unlinkPlanning: editor.item.events.unlinkPlanning,
                        updatePlanningItem: editor.item.events.updatePlanningItem,
                    },
                }}
            />
        );
    }
}

export const EventEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(EventEditorComponent);
