import * as React from 'react';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {
    IEventItem,
    IEventFormProfile,
    IFile,
    IPlanningItem,
    IFormItemManager,
    EDITOR_TYPE,
    ILocation,
} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {EditorForm} from '../../Editor/EditorForm';
import {EventEditorHeader} from './EventEditorHeader';
import {ContentBlock} from '../../UI/SidePanel';
import {EventScheduleSummary} from '../EventScheduleSummary';
import {CreateNewGeoLookup} from '../../GeoLookupInput/CreateNewGeoLookup';

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

        this.showAddLocationForm = this.showAddLocationForm.bind(this);
        this.onCloseAddNewLocation = this.onCloseAddNewLocation.bind(this);
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

        if (!isEqual(this.props.original?.planning_ids, prevProps.original?.planning_ids)) {
            this.props.itemManager.forceUpdateInitialValues({
                planning_ids: this.props.original?.planning_ids ?? [],
            });
        }
    }

    getRelatedPlanningsForEvent(): Array<IPlanningItem> {
        return this.props.plannings?.filter(
            (plan) => plan.event_item === this.props.item?._id
        );
    }

    showAddLocationForm(props: any): Promise<ILocation | undefined> {
        const editor = planningApi.editor(this.props.editorType);

        return editor.form.showPopupForm(CreateNewGeoLookup, props)
            .finally(() => {
                // Re-focus the location text input
                const editor = planningApi.editor(this.props.editorType);

                editor.form.scrollToBookmarkGroup('location');
            });
    }

    onCloseAddNewLocation() {
        const editor = planningApi.editor(this.props.editorType);

        editor.form.closePopupForm();
    }

    onDatesChanged(value: {[key: string]: any}) {
        const editor = planningApi.editor(this.props.editorType);

        editor.item.events.onEventDatesChanged({
            start: value['dates.start'],
            end: value['dates.end'],
            tz: value['dates.tz'],
        });

        this.props.onChangeHandler(value);
    }

    renderHeader() {
        return !this.props.itemExists ? null : (
            <React.Fragment>
                <EventEditorHeader item={this.props.item} />
                <ContentBlock padSmall={true}>
                    <EventScheduleSummary
                        schedule={{
                            dates: this.props.diff?.dates ?? {},
                            _time_to_be_confirmed: this.props.diff?._time_to_be_confirmed,
                        }}
                        noPadding={true}
                    />
                </ContentBlock>
            </React.Fragment>
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const editor = planningApi.editor(this.props.editorType);
        const language = this.props.diff.language ?? getUserInterfaceLanguage();

        return (
            <EditorForm
                itemManager={this.props.itemManager}
                defaultGroup={!this.props.itemExists ? 'schedule' : 'description'}
                header={this.renderHeader()}
                activeNav={this.props.activeNav}
                editorType={this.props.editorType}
                globalProps={{
                    item: this.props.diff,
                    language: language,
                    onChange: this.props.onChangeHandler,
                    errors: this.props.errors,
                    disabled: this.props.readOnly,
                    showErrors: this.props.submitFailed,
                    profile: this.props.formProfile,
                }}
                schema={this.props.formProfile.schema}
                fieldProps={{
                    'dates.recurring_rules': {
                        field: 'dates',
                        defaultValue: {},
                        enabled: !this.props.itemExists,
                    },
                    dates: {
                        required: true,
                        showAllDay: true,
                        showTimeZone: true,
                        enabled: !this.props.itemExists,
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
                        showAddLocationForm: this.showAddLocationForm,
                        onPopupClose: this.onCloseAddNewLocation,
                        onCancel: this.onCloseAddNewLocation,
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
                        removePlanningItem: editor.item.events.removePlanningItem,
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
