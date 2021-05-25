import React from 'react';
import {connect} from 'react-redux';
import {get, forEach} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../superdeskApi';
import {IArticle, IDesk} from 'superdesk-api';
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

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {planningUtils, generateTempId, assignmentUtils} from '../../../utils';
import {profileConfigToFormProfile} from '../../../utils/forms';
import {WORKFLOW_STATE} from '../../../constants';
import {EditorFieldSelect} from '../../fields/editor/base/select';
import {getUsersDefaultLanguage} from '../../../utils/users';
import {renderFieldsForPanel} from '../../fields';

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
    addNewsItemToPlanning?: IArticle;
    index: number;
    defaultDesk: IDesk;
    files: Array<IFile>;
    includeScheduledUpdates?: boolean;

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
    formProfile: selectors.forms.coverageProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    setCoverageDefaultDesk: (coverage) => dispatch(actions.users.setCoverageDefaultDesk(coverage)),
});

export class CoverageFormComponent extends React.Component<IProps, IState> {
    fullFilePath: string;
    xmpFullFilePath: string;
    dom: {
        contentType?: React.RefObject<EditorFieldSelect>;
        popupContainer?: any;
    };

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
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
        this.onContentTypeChange = this.onContentTypeChange.bind(this);
        this.dom = {
            contentType: React.createRef(),
            popupContainer: null,
        };
        this.state = {
            openScheduledUpdates: [],
            uploading: false,
        };
        this.fullFilePath = 'planning.files';
        this.xmpFullFilePath = 'planning.xmp_file';
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (!prevProps.hasAssignment && this.props.hasAssignment) {
            this.dom.contentType.current?.focus();
        }
    }

    onChange(field: string, value: any) {
        this.props.onChange(
            `${this.props.field}.${field}`,
            value
        );
    }

    onTimeToBeConfirmed() {
        this.onChange('_time_to_be_confirmed', true);
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
            if (!get(value, 'planning.scheduled')) {
                finalValue = newValue.add(1, 'hour').startOf('hour');
                relatedFieldStr = null;
            }
        } else if (field.endsWith('._scheduledTime')) {
            // If there is no current scheduled date, then set the date to today
            relatedFieldStr = field.replace('_scheduledTime', 'scheduled');
            fieldStr = field;

            this.onChange('_time_to_be_confirmed', false);

            if (!get(value, 'planning.scheduled')) {
                finalValue = moment().hour(newValue.hour())
                    .minute(newValue.minute());
            } else {
                // Set the date from the original date
                finalValue = moment(value.planning.scheduled)
                    .clone()
                    .hour(newValue.hour())
                    .minute(newValue.minute());
            }
        } else {
            this.onChange(field, newValue);
            return;
        }

        this.onChange(fieldStr, finalValue);
        if (relatedFieldStr) {
            this.onChange(relatedFieldStr, finalValue);
        }
    }

    onAddScheduledUpdate() {
        let defaultScheduledUpdate = {
            coverage_id: get(this.props, 'value.coverage_id'),
            scheduled_update_id: generateTempId(),
            planning: {
                internal_note: get(this.props, 'value.planning.internal_note'),
                genre: ((get(this.props, 'genres') || []).find((g) => g.qcode === 'Update') ||
                    get(this.props, 'value.planning.genre')),
            },
            news_coverage_status: this.props.newsCoverageStatus[0],
            workflow_status: WORKFLOW_STATE.DRAFT,
        };

        // Set default desks for coverage type
        planningUtils.setDefaultAssignment(defaultScheduledUpdate, this.props.preferredCoverageDesks,
            get(this.props, 'value.planning.g2_content_type'), this.props.defaultDesk);

        this.onChange('scheduled_updates',
            [
                ...get(this.props, 'value.scheduled_updates', []),
                defaultScheduledUpdate,
            ]);
        this.setState({openScheduledUpdates: [
            ...this.state.openScheduledUpdates,
            defaultScheduledUpdate.scheduled_update_id,
        ]});
    }

    onRemoveScheduledUpdate(indexToRemove: number) {
        // Remove the scheduled update at the index
        this.onChange(
            'scheduled_updates',
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

        if (get(fileList, 'length', 0) > 1) {
            this.props.notifyValidationErrors([gettext('You can associate only one XMP file')]);
            return;
        }

        let error;

        forEach(fileList, (f) => {
            if (!get(f, 'name').toLowerCase()
                .endsWith('.xmp')) {
                error = true;
            }
        });

        if (error) {
            this.props.notifyValidationErrors([gettext('Only one XMP files are accepted')]);
            return;
        }

        return this.onAddFiles(fileList, true);
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
                const value = xmpFile ? get(newFiles, '[0]._id') :
                    [
                        ...this.getCoverageFiles(),
                        ...newFiles.map((f) => f._id),
                    ];

                this.onChange(changeFullFilePath, value);
                this.setState({uploading: false});
            }, () => {
                this.props.notifyValidationErrors(['Failed to upload files']);
                this.setState({uploading: false});
            });
    }

    onRemoveFile(file: IFile, xmpFile: boolean = false) {
        const coverageFiles = this.getCoverageFiles();
        const promise = (xmpFile ? file : !coverageFiles.includes(file._id)) ?
            this.props.removeFile(file) : Promise.resolve();
        const changeFullFilePath = xmpFile ? this.xmpFullFilePath : this.fullFilePath;
        const value = xmpFile ? null : coverageFiles.filter((f) => f !== file._id);

        promise.then(() => this.onChange(changeFullFilePath, value));
    }

    onContentTypeChange(field: string, value: IG2ContentType['qcode']) {
        if (this.props.value.planning?.g2_content_type !== value) {
            this.onChange(field, value);
            this.onChange('planning.genre', null);
        }
    }

    render() {
        const contentTypeQcode = this.props.value.planning?.g2_content_type;
        const defaultGenre = (appConfig.default_genre || [{}])[0];
        const showXmpFileInput = planningUtils.showXMPFileUIControl(this.props.value);
        const hideXmpFileInput = this.props.value.planning?.xmp_file != null;

        const readOnlyFields = planningUtils.getCoverageReadOnlyFields(
            this.props.value,
            this.props.readOnly,
            this.props.newsCoverageStatus,
            this.props.addNewsItemToPlanning
        );
        const {profile, fieldProps} = profileConfigToFormProfile(
            this.props.formProfile,
            [
                ['coverage_contact', 'contact_info'],
                ['g2_content_type'],
                ['language'],
                ['xmp_file'],
                ['genre'],
                ['slugline'],
                ['ednote'],
                ['keywords', 'keyword'],
                ['internal_note'],
                ['files'],
                ['news_coverage_status'],
                ['coverage_schedule', 'scheduled'],
                ['flags.no_content_linking', 'flags'],
                ['scheduled_updates'],
            ],
            {
                coverage_contact: {
                    field: 'planning.contact_info',
                    assignmentField: 'assigned_to.contact',
                    label: assignmentUtils.getContactLabel(this.props.value),
                },
                g2_content_type: {
                    readOnly: this.props.readOnly || readOnlyFields.g2_content_type,
                    field: 'planning.g2_content_type',
                    onChange: this.onContentTypeChange,
                    clearable: false,
                    valueAsString: true,
                    refNode: this.dom.contentType,
                },
                language: {
                    field: 'planning.language',
                    clearable: false,
                },
                xmp_file: {
                    readOnly: this.props.readOnly || readOnlyFields.xmp_file,
                    field: 'planning.xmp_file',
                    enabled: showXmpFileInput,
                    hideInput: hideXmpFileInput,
                    createUploadLink: this.props.createUploadLink,
                    files: this.props.files,
                    onAddFiles: this.onAddXmpFile,
                    onRemoveFile: this.onRemoveXmpFile,
                },
                genre: {
                    readOnly: this.props.readOnly || readOnlyFields.genre,
                    field: 'planning.genre',
                    defaultValue: contentTypeQcode === 'text' ? defaultGenre : null,
                    clearable: true,
                },
                slugline: {
                    readOnly: this.props.readOnly || readOnlyFields.slugline,
                    field: 'planning.slugline',
                },
                ednote: {
                    readOnly: this.props.readOnly || readOnlyFields.ednote,
                    field: 'planning.ednote',
                },
                keywords: {
                    readOnly: this.props.readOnly || readOnlyFields.keyword,
                    field: 'planning.keyword',
                },
                internal_note: {
                    readOnly: this.props.readOnly || readOnlyFields.internal_note,
                    field: 'planning.internal_note',
                },
                files: {
                    readOnly: this.props.readOnly || readOnlyFields.files,
                    field: 'planning.files',
                },
                news_coverage_status: {
                    readOnly: this.props.readOnly || readOnlyFields.newsCoverageStatus,
                    field: 'news_coverage_status',
                },
                coverage_schedule: {
                    readOnly: this.props.readOnly || readOnlyFields.scheduled,
                    field: 'planning.scheduled',
                    timeField: 'planning._scheduledTime',
                    toBeConfirmed: this.props.value?._time_to_be_confirmed,
                    onToBeConfirmed: this.onTimeToBeConfirmed,
                    onChange: this.onScheduleChanged,
                },
                'flags.no_content_linking': {
                    readOnly: this.props.readOnly || readOnlyFields.flags,
                    field: 'flags.no_content_linking',
                },
                scheduled_updates: {
                    onRemoveAssignment: this.props.onRemoveAssignment,
                    setCoverageDefaultDesk: this.props.setCoverageDefaultDesk,
                    onRemoveScheduledUpdate: this.onRemoveScheduledUpdate,
                    onScheduleChanged: this.onScheduleChanged,
                    onScheduledUpdateClose: this.onScheduledUpdateClose,
                    onScheduledUpdateOpen: this.onScheduledUpdateOpen,
                    onAddScheduledUpdate: this.onAddScheduledUpdate,
                    canCreateScheduledUpdate: this.props.addNewsItemToPlanning == null &&
                    !get(this.props.diff, `${this.props.field}.flags.no_content_linking`),
                },
            }
        );

        const globalProps = {
            item: this.props.value,
            language: this.props.value.planning?.language ?? getUsersDefaultLanguage(),
            onChange: this.onChange,
            errors: this.props.errors,
            readOnly: this.props.readOnly,
            disabled: this.props.readOnly,
        };

        if (!this.props.includeScheduledUpdates) {
            profile.scheduled_updates.enabled = false;
        }

        return (
            <div className="coverage-editor">
                {renderFieldsForPanel(
                    'editor',
                    profile,
                    globalProps,
                    fieldProps
                )}
            </div>
        );
    }
}

export const CoverageForm = connect(mapStateToProps, mapDispatchToProps)(CoverageFormComponent);
