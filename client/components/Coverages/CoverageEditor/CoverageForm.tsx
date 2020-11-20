import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../superdeskApi';
import {
    ICoverageFormProfile,
    ICoverageScheduledUpdate,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    IG2ContentType,
    IGenre,
    IKeyword,
    IFile,
} from '../../../interfaces';
import {IArticle, IDesk} from 'superdesk-api';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {getItemInArrayById, planningUtils, generateTempId, assignmentUtils} from '../../../utils';
import {WORKFLOW_STATE, TO_BE_CONFIRMED_FIELD} from '../../../constants';
import {Button} from '../../UI';
import {Row, Label, LineInput, FileInput} from '../../UI/Form';
import {ScheduledUpdate} from '../ScheduledUpdate';


import {
    TextInput,
    TextAreaInput,
    ExpandableTextAreaInput,
    SelectInput,
    DateTimeInput,
    SelectTagInput,
    Field,
    ToggleInput,
} from '../../UI/Form';
import {InternalNoteLabel} from '../../';
import {ContactField, ContactsPreviewList} from '../../Contacts';

import '../style.scss';

interface IProps {
    // Values
    field: string;
    value: IPlanningCoverageItem;
    readOnly: boolean;
    message: string | {[key: string]: any};
    item: IPlanningItem;
    diff: Partial<IPlanningItem>;
    formProfile: ICoverageFormProfile;
    errors: {[key: string]: any}
    showErrors: boolean;
    hasAssignment: boolean;
    addNewsItemToPlanning: IArticle;
    index: number;
    defaultDesk: IDesk;
    files: Array<IFile>;

    // Functions
    onChange(field: string, value: any): void;
    popupContainer(): HTMLElement;
    onFieldFocus(): void;
    onPopupOpen(): void;
    onPopupClose(): void;
    onRemoveAssignment(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate: any,
        scheduledUpdateIndex: number
    ): void;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    createUploadLink(file: IFile): void;
    removeFile(file: IFile): Promise<void>;
    notifyValidationErrors(errors: Array<string>): void;

    // Redux States
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    languages: Array<string>;
    genres: Array<IGenre>;
    keywords: Array<IKeyword>;
    preferredCoverageDesks: {[key: string]: string};
    planningAllowScheduledUpdates: boolean;

    // Redux Dispatches
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
}

interface IState {
    openScheduledUpdates: Array<any>;
    uploading: boolean;
}

const mapStateToProps = (state) => ({
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    languages: selectors.vocabs.getLanguages(state),
    genres: state.genres,
    keywords: selectors.general.keywords(state),
    preferredCoverageDesks: selectors.general.preferredCoverageDesks(state)?.desks ?? {},
    planningAllowScheduledUpdates: selectors.forms.getPlanningAllowScheduledUpdates(state),
});

const mapDispatchToProps = (dispatch) => ({
    setCoverageDefaultDesk: (coverage) => dispatch(actions.users.setCoverageDefaultDesk(coverage)),
});

export class CoverageFormComponent extends React.Component<IProps, IState> {
    fullFilePath: string;
    xmpFullFilePath: string;
    dom: {
        contentType?: any;
        popupContainer?: any;
    };

    constructor(props) {
        super(props);
        this.onScheduleChanged = this.onScheduleChanged.bind(this);
        this.onTimeToBeConfirmed = this.onTimeToBeConfirmed.bind(this);
        this.onAddScheduledUpdate = this.onAddScheduledUpdate.bind(this);
        this.onRemoveScheduledUpdate = this.onRemoveScheduledUpdate.bind(this);
        this.onScheduledUpdateClose = this.onScheduledUpdateClose.bind(this);
        this.onScheduledUpdateOpen = this.onScheduledUpdateOpen.bind(this);
        this.onAddFiles = this.onAddFiles.bind(this);
        this.onRemoveFile = this.onRemoveFile.bind(this);
        this.onAddXmpFile = this.onAddXmpFile.bind(this);
        this.onRemoveXmpFile = this.onRemoveXmpFile.bind(this);
        this.dom = {
            contentType: null,
            popupContainer: null,
        };
        this.state = {
            openScheduledUpdates: [],
            uploading: false,
        };
        this.fullFilePath = `coverages[${this.props.index}].planning.files`;
        this.xmpFullFilePath = `coverages[${this.props.index}].planning.xmp_file`;
    }

    componentDidUpdate(prevProps: IProps) {
        if (!prevProps.hasAssignment && this.props.hasAssignment) {
            this.dom.contentType.focus();
        }
    }

    onTimeToBeConfirmed() {
        const {onChange, index} = this.props;

        onChange(`coverages[${index}].${TO_BE_CONFIRMED_FIELD}`, true);
    }

    getCoverageFiles(): Array<string> {
        return this.props.value?.planning?.files ?? [];
    }

    onScheduleChanged(field: string, newValue: moment.Moment) {
        const {value, onChange, index} = this.props;
        const hasSchedule = value?.planning?.scheduled != null;
        let finalValue = newValue;
        let fieldStr: string;
        let relatedFieldStr: string;

        // We will be updating scheduled and _scheduledTime together
        // relatedFieldStr will be '_scheduledTime' if date gets changed and vice versa
        // Update time only if date is already set
        if (field.endsWith('.date')) {
            fieldStr = field.slice(0, -5);
            relatedFieldStr = field.replace('scheduled.date', '_scheduledTime');
            // If there is no current scheduled date, then set the time value to end of the day
            if (hasSchedule) {
                finalValue = newValue
                    .add(1, 'hour')
                    .startOf('hour');
                relatedFieldStr = null;
            }
        } else if (field.endsWith('._scheduledTime')) {
            // If there is no current scheduled date, then set the date to today
            relatedFieldStr = field.replace('_scheduledTime', 'scheduled');
            fieldStr = field;

            onChange(`coverages[${index}].${TO_BE_CONFIRMED_FIELD}`, false);

            if (hasSchedule) {
                finalValue = moment()
                    .hour(newValue.hour())
                    .minute(newValue.minute());
            } else {
                // Set the date from the original date
                finalValue = moment(value.planning.scheduled)
                    .clone()
                    .hour(newValue.hour())
                    .minute(newValue.minute());
            }
        } else {
            onChange(field, newValue);
            return;
        }

        onChange(fieldStr, finalValue);
        if (relatedFieldStr) {
            onChange(relatedFieldStr, finalValue);
        }
    }

    onAddScheduledUpdate() {
        let defaultScheduledUpdate = {
            coverage_id: this.props.value?.coverage_id,
            scheduled_update_id: generateTempId(),
            planning: {
                internal_note: this.props.value?.planning?.internal_note,
                genre: (this.props.genres ?? []).find((g) => g.qcode === 'Update') ||
                    this.props.value?.planning?.genre,
            },
            news_coverage_status: this.props.newsCoverageStatus[0],
            workflow_status: WORKFLOW_STATE.DRAFT,
        };

        // Set default desks for coverage type
        planningUtils.setDefaultAssignment(
            defaultScheduledUpdate,
            this.props.preferredCoverageDesks,
            this.props.value?.planning?.g2_content_type,
            this.props.defaultDesk
        );

        this.props.onChange(`${this.props.field}.scheduled_updates`,
            [
                ...(this.props.value?.scheduled_updates ?? []),
                defaultScheduledUpdate,
            ]);
        this.setState({openScheduledUpdates: [
            ...this.state.openScheduledUpdates,
            defaultScheduledUpdate.scheduled_update_id,
        ]});
    }

    onRemoveScheduledUpdate(indexToRemove: number) {
        // Remove the scheduled update at the index
        this.props.onChange(
            `${this.props.field}.scheduled_updates`,
            this.props.value.scheduled_updates.filter(
                (_, index) => index !== indexToRemove
            )
        );
    }

    onScheduledUpdateOpen(scheduledUpdate: ICoverageScheduledUpdate) {
        if (!this.state.openScheduledUpdates.includes(scheduledUpdate.scheduled_update_id)) {
            this.setState({openScheduledUpdates: [
                ...this.state.openScheduledUpdates,
                scheduledUpdate.scheduled_update_id,
            ]});
        }
    }

    onScheduledUpdateClose(scheduledUpdate: ICoverageScheduledUpdate) {
        this.setState({
            openScheduledUpdates: this.state.openScheduledUpdates.filter((s) =>
                s !== scheduledUpdate.scheduled_update_id
            )});
    }

    onAddXmpFile(fileList: FileList) {
        const {gettext} = superdeskApi.localization;

        if ((fileList?.length ?? 0) > 1) {
            this.props.notifyValidationErrors([gettext('You can associate only one XMP file')]);
            return;
        }

        let error;

        Array.from(fileList).forEach((file: File) => {
            if (!(file.name ?? '').toLowerCase().endsWith('.xmp')) {
                error = true;
            }
        });

        if (error) {
            this.props.notifyValidationErrors([gettext('Only one XMP files are accepted')]);
            return;
        }

        this.onAddFiles(fileList, true);
    }

    onRemoveXmpFile(file: IFile) {
        this.onRemoveFile(file, true);
    }

    onAddFiles(fileList: FileList, xmpFile: boolean = false) {
        const files = Array.from(fileList).map((f) => [f]);
        const changeFullFilePath = xmpFile ? this.xmpFullFilePath : this.fullFilePath;

        this.setState({uploading: true});
        this.props.uploadFiles(files)
            .then((newFiles) => {
                const value = xmpFile ? newFiles?.[0]?._id :
                    [
                        ...this.getCoverageFiles(),
                        ...newFiles.map((f) => f._id),
                    ];

                this.props.onChange(changeFullFilePath, value);
                this.setState({uploading: false});
            }, () => {
                this.props.notifyValidationErrors(['Failed to upload files']);
                this.setState({uploading: false});
            });
    }

    onRemoveFile(file: IFile, xmpFile = false) {
        const promise = (xmpFile ? file : !this.getCoverageFiles().includes(file._id)) ?
            this.props.removeFile(file) :
            Promise.resolve();
        const changeFullFilePath = xmpFile ?
            this.xmpFullFilePath :
            this.fullFilePath;
        const value = xmpFile ?
            null :
            this.getCoverageFiles()
                .filter((f) => f !== file._id);

        promise.then(() => this.props.onChange(changeFullFilePath, value));
    }

    render() {
        const {
            field,
            value,
            index,
            onChange,
            newsCoverageStatus,
            contentTypes,
            languages,
            genres,
            keywords,
            readOnly,
            item,
            diff,
            formProfile,
            errors,
            showErrors,
            hasAssignment,
            addNewsItemToPlanning,
            popupContainer,
            onFieldFocus,
            onPopupOpen,
            onPopupClose,
            planningAllowScheduledUpdates,
            onRemoveAssignment,
            setCoverageDefaultDesk,
            createUploadLink,
            files,
            ...props
        } = this.props;

        const {gettext} = superdeskApi.localization;
        const contentTypeQcode = value.planning?.g2_content_type ?? null;
        const contentType = contentTypeQcode ? getItemInArrayById(contentTypes, contentTypeQcode, 'qcode') : null;
        const onContentTypeChange = (f, v) => {
            if (v) {
                onChange(f, v?.qcode ?? null);
                onChange(`${field}.planning.genre`, null);
            }
        };
        const defaultGenre = (appConfig.default_genre || [{}])[0];

        if (contentTypeQcode === 'text' && value.planning?.genre == null) {
            value.planning.genre = defaultGenre;
        }

        const fieldProps = {
            item: item,
            diff: diff,
            onChange: onChange,
            formProfile: formProfile,
            errors: errors,
            showErrors: showErrors,
            onFocus: onFieldFocus,
        };

        const roFields = planningUtils.getCoverageReadOnlyFields(
            value,
            readOnly,
            newsCoverageStatus,
            addNewsItemToPlanning
        );

        const canCreateScheduledUpdate = !addNewsItemToPlanning &&
            !get(diff, `${field}.flags.no_content_linking`);

        const contactLabel = assignmentUtils.getContactLabel(get(diff, field));
        const showXmpFileInput = planningUtils.showXMPFileUIControl(value);
        const hideXMPFileInput = this.props.value?.planning?.xmp_file != null;

        return (
            <div className="coverage-editor">
                {get(diff, `${field}.assigned_to.contact`) ? (
                    <Row className="coverage-editor__contact">
                        <Label row={true} text={contactLabel} />
                        <ContactsPreviewList
                            contactIds={[get(diff, `${field}.assigned_to.contact`)]}
                            scrollInView={true}
                            scrollIntoViewOptions={{block: 'center'}}
                        />
                    </Row>
                ) : (
                    <Field
                        component={ContactField}
                        field={`${field}.planning.contact_info`}
                        profileName="contact_info"
                        label={contactLabel}
                        defaultValue={[]}
                        {...fieldProps}
                        readOnly={readOnly}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                        singleValue={true}
                    />
                )}

                <InternalNoteLabel
                    item={diff}
                    prefix={`coverages[${index}].planning.`}
                    noteField="workflow_status_reason"
                    showTooltip={false}
                    showText
                    stateField={value.workflow_status === WORKFLOW_STATE.CANCELLED ?
                        `coverages[${index}].workflow_status` : 'state'}
                    className="form__row"
                />
                <Field
                    component={SelectInput}
                    field={`${field}.planning.g2_content_type`}
                    profileName="g2_content_type"
                    label={gettext('Coverage Type')}
                    options={contentTypes}
                    labelField="name"
                    clearable={false}
                    value={contentType}
                    defaultValue={null}
                    {...fieldProps}
                    onChange={onContentTypeChange}
                    readOnly={roFields.g2_content_type}
                    autoFocus={hasAssignment}
                    refNode={(ref) => this.dom.contentType = ref}
                />

                <Field
                    component={SelectInput}
                    field={`${field}.planning.language`}
                    profileName="language"
                    label={gettext('Language')}
                    defaultValue={null}
                    options={languages}
                    {...fieldProps}
                    labelField={'name'}
                    clearable={true}
                    valueAsString={true}
                />


                {showXmpFileInput && (
                    <div
                        className={this.state.uploading ? 'sd-loader' : 'sd-line-input'}
                    >
                        {!this.state.uploading && (
                            <Field
                                label={gettext('Associate an XMP file')}
                                component={FileInput}
                                field={`${field}.planning.xmp_file`}
                                createLink={createUploadLink}
                                defaultValue={[]}
                                readOnly={roFields.xmp_file}
                                hideInput={hideXMPFileInput}
                                {...fieldProps}
                                files={files}
                                onAddFiles={this.onAddXmpFile}
                                onRemoveFile={this.onRemoveXmpFile}
                                formats={'*.xmp'}
                            />
                        )}
                    </div>
                )}

                <Field
                    component={SelectInput}
                    field={`${field}.planning.genre`}
                    profileName="genre"
                    label={gettext('Genre')}
                    options={genres}
                    labelField="name"
                    clearable={true}
                    defaultValue={contentTypeQcode === 'text' ? defaultGenre : null}
                    readOnly={roFields.genre}
                    {...fieldProps}
                />

                <Field
                    component={TextInput}
                    field={`${field}.planning.slugline`}
                    profileName="slugline"
                    label={gettext('Slugline')}
                    readOnly={roFields.slugline}
                    autoFocus={hasAssignment && roFields.g2_content_type}
                    {...fieldProps}
                />

                <Field
                    component={TextAreaInput}
                    field={`${field}.planning.ednote`}
                    profileName="ednote"
                    label={gettext('Ed Note')}
                    readOnly={roFields.ednote}
                    {...fieldProps}
                />

                <Field
                    component={SelectTagInput}
                    field={`${field}.planning.keyword`}
                    profileName="keyword"
                    label={gettext('Keywords')}
                    defaultValue={[]}
                    options={keywords}
                    readOnly={roFields.keyword}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                />

                <Field
                    component={ExpandableTextAreaInput}
                    field={`${field}.planning.internal_note`}
                    profileName="internal_note"
                    label={gettext('Internal Note')}
                    readOnly={roFields.internal_note}
                    {...fieldProps}
                />

                {formProfile.editor.files.enabled && (
                    <div className={this.state.uploading ? 'sd-loader' : 'sd-line-input'}>
                        {!this.state.uploading && (
                            <Field
                                label={gettext('Attach files')}
                                component={FileInput}
                                field={`${field}.planning.files`}
                                profileName="files"
                                createLink={createUploadLink}
                                defaultValue={[]}
                                readOnly={roFields.files}
                                {...fieldProps}
                                files={files}
                                onAddFiles={this.onAddFiles}
                                onRemoveFile={this.onRemoveFile}
                            />
                        )}
                    </div>
                )}

                <Field
                    component={SelectInput}
                    field={`${field}.news_coverage_status`}
                    profileName="news_coverage_status"
                    label={gettext('Coverage Status')}
                    defaultValue={planningUtils.getDefaultCoverageStatus(newsCoverageStatus)}
                    options={newsCoverageStatus}
                    {...fieldProps}
                    readOnly={roFields.newsCoverageStatus}
                />

                <Field
                    component={DateTimeInput}
                    field={`${field}.planning.scheduled`}
                    profileName="scheduled"
                    label={gettext('Due')}
                    defaultValue={null}
                    row={false}
                    {...fieldProps}
                    onChange={this.onScheduleChanged}
                    readOnly={roFields.scheduled}
                    popupContainer={popupContainer}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField={`${field}.planning._scheduledTime`}
                    showToBeConfirmed
                    toBeConfirmed={get(value, TO_BE_CONFIRMED_FIELD)}
                    onToBeConfirmed={this.onTimeToBeConfirmed}
                />

                <Field
                    component={ToggleInput}
                    field={`${field}.flags.no_content_linking`}
                    label={gettext('Do not link content updates')}
                    labelLeft={true}
                    defaultValue={false}
                    {...fieldProps}
                    readOnly={roFields.flags}
                    profileName="flags"
                />

                {planningAllowScheduledUpdates && contentTypeQcode === 'text' && (
                    <Row>
                        <LineInput><Label text={gettext('SCHEDULED UPDATES')} /></LineInput>
                        {(value.scheduled_updates || []).map((s, i) => (
                            <ScheduledUpdate
                                key={i}
                                value={s}
                                field={field}
                                coverageIndex={index}
                                index={i}
                                newsCoverageStatus={newsCoverageStatus}
                                readOnly={readOnly}
                                contentTypes={contentTypes}
                                onRemoveAssignment={onRemoveAssignment}
                                setCoverageDefaultDesk={setCoverageDefaultDesk}
                                onRemove={this.onRemoveScheduledUpdate.bind(null, i)}
                                onScheduleChanged={this.onScheduleChanged}
                                genres={genres}
                                onClose={this.onScheduledUpdateClose}
                                onOpen={this.onScheduledUpdateOpen}
                                openScheduledUpdates={this.state.openScheduledUpdates}
                                {...fieldProps}
                                {...props}
                            />
                        ))}
                        {canCreateScheduledUpdate && (
                            <Button
                                color="primary"
                                text={gettext('Schedule an update')}
                                onClick={this.onAddScheduledUpdate}
                            />
                        )}
                    </Row>
                )}

            </div>
        );
    }
}

export const CoverageForm = connect(mapStateToProps, mapDispatchToProps)(CoverageFormComponent);
