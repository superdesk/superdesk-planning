import React from 'react';
import {connect} from 'react-redux';
import {get, forEach, partition} from 'lodash';
import moment from 'moment';
import {appConfig} from 'appConfig';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {Dictionary, IArticle, IDesk, IVocabularyItem} from 'superdesk-api';
import {
    EDITOR_TYPE,
    ICoverageScheduledUpdate,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    IG2ContentType,
    IGenre,
    IKeyword,
    IFile,
    ICoverageType,
    IPlanningContentProfile,
    IProfileSchemaTypeList,
} from '../../../interfaces';
import * as selectors from '../../../selectors';
import {planningUtils, generateTempId, assignmentUtils, isItemExpired} from '../../../utils';
import {WORKFLOW_STATE} from '../../../constants';
import {EditorFieldSelect} from '../../fields/editor/base/select';
import {renderFieldsForPanel} from '../../fields';
import {getCoverageFields} from '../../../api/editor/item_planning';
import {coverageProfiles} from '../../../selectors/coverageProfiles';

import '../style.scss';
import {VOCABULARIES_TO_BE_EXCLUDED} from '../../../utils/contentProfiles';
import {isCustomVocabulary} from '../../../helpers';
import {isCoverageAssigned, isCoverageDraft} from '../../../utils/planning';

interface IOwnProps {
    field: string;
    value: IPlanningCoverageItem;
    readOnly: boolean;
    message: string | {[key: string]: any};
    item: IPlanningItem;
    diff: Partial<IPlanningItem>;
    errors: {[key: string]: any}
    showErrors: boolean;
    hasAssignment: boolean;
    addNewsItemToPlanning?: IArticle;
    index: number;
    defaultDesk: IDesk;
    files: Array<IFile>;
    includeScheduledUpdates?: boolean;
    editorType: EDITOR_TYPE;
    language: IVocabularyItem['qcode'];
    coverages: Array<IPlanningCoverageItem>;
    profile: IPlanningContentProfile;

    // Functions
    onChange(field: string, value: any): void;
    onFieldFocus(): void;
    onPopupOpen(): void;
    onPopupClose(): void;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    createUploadLink?(file: IFile): void;
    removeFile(file: IFile): Promise<void>;
    notifyValidationErrors?(errors: Array<string>): void;
}

interface IReduxStateProps {
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    languages: Array<string>;
    genres: Array<IGenre>;
    keywords: Array<IKeyword>;
    preferredCoverageDesks: {[key: string]: string};
}

interface IState {
    openScheduledUpdates: Array<ICoverageScheduledUpdate['scheduled_update_id']>;
    uploading: boolean;
}

const mapStateToProps = (state) => ({
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    languages: selectors.vocabs.getLanguages(state),
    genres: state.genres,
    keywords: selectors.general.keywords(state),
    preferredCoverageDesks: selectors.general.preferredCoverageDesks(state)?.desks ?? {},
});

type IProps = IOwnProps & IReduxStateProps;

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
        this.toggleAddToWorkflow = this.toggleAddToWorkflow.bind(this);
        this.onAnpaCategoryChange = this.onAnpaCategoryChange.bind(this);

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
        const {onChange, index} = this.props;

        onChange(
            `coverages.${index}.${field}`,
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

        if (field.includes('scheduled_updates')) {
            // Handles scheduled updates `field` might look like `scheduled_updates[0].schedule.time`,
            // we now support date and time in a single field
            const preparedField = `coverages.${0}.${field.replace('.time', '').replace('.date', '')}`;

            onChange(preparedField, newValue);
        } else {
            onChange(`coverages.${index}`,
                {
                    ...value,
                    planning: {
                        ...value.planning,
                        scheduled: newValue,
                    },
                } satisfies IPlanningCoverageItem,
            );
        }
    }

    onAddScheduledUpdate() {
        const defaultScheduledUpdate: any = {
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
            this.props.notifyValidationErrors?.([gettext('You can associate only one XMP file')]);
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
            this.props.notifyValidationErrors?.([gettext('Only one XMP files are accepted')]);
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
        return this.props.uploadFiles?.(files)
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

    onContentTypeChange(_field: string, value: ICoverageType) {
        if (this.props.value.planning?.g2_content_type == value) {
            return;
        }

        const withoutUpdated = this.props.coverages.filter((x) => x.coverage_id !== this.props.value.coverage_id);
        const allProfiles = coverageProfiles(planningApi.redux.store.getState());
        const profile = allProfiles.find((x) => x.content_type === value);

        this.props.onChange(
            'coverages',
            [
                ...withoutUpdated,
                {
                    ...this.props.value,
                    planning: {
                        ...this.props.value.planning,
                        g2_content_type: value,
                        genre: null,
                    },
                    profile: profile._id,
                },
            ],
        );
    }

    toggleAddToWorkflow() {
        const {vocabulary} = superdeskApi.entities;
        const coverageStatuses = vocabulary
            .getAll()
            .get('newscoveragestatus').items as Array<IPlanningNewsCoverageStatus>;
        const updatedCoverage = planningUtils.addCoverageToWorkflow(this.props.value, coverageStatuses);
        const coveragesWithoutUpdated =
            this.props.coverages.filter((x) => x.coverage_id !== updatedCoverage.coverage_id);
        const {workflow_status, news_coverage_status, assigned_to, add_coverage_to_workflow} = updatedCoverage;

        if (updatedCoverage.add_coverage_to_workflow) {
            this.props.onChange(
                'coverages',
                [
                    ...coveragesWithoutUpdated,
                    {
                        ...this.props.value,
                        workflow_status: workflow_status,
                        news_coverage_status: news_coverage_status,
                        assigned_to: {
                            ...assigned_to,
                            state: assigned_to.state,
                        },
                        add_coverage_to_workflow: add_coverage_to_workflow,
                    },
                ],
            );
        } else {
            planningApi.coverages.cancelCoverage(this.props.coverages, this.props.value)
                .then((nextCoverages) => {
                    this.props.onChange('coverages', nextCoverages);
                });
        }
    }

    onAnpaCategoryChange(_field, nextValue?: Array<IVocabularyItem>) {
        const coveragesWithoutUpdates =
            this.props.coverages.filter((x) => x.coverage_id !== this.props.value.coverage_id);

        this.props.onChange(
            'coverages',
            [
                ...coveragesWithoutUpdates,
                {
                    ...this.props.value,
                    planning: {
                        ...this.props.value.planning,
                        anpa_category: (nextValue ?? []).map((x) => ({qcode: x.qcode, name: x.name})),
                    },
                },
            ],
        );
    }

    render() {
        const contentTypeQcode = this.props.value.planning?.g2_content_type;
        const {searchProfile, profile} = getCoverageFields(contentTypeQcode);

        const defaultGenre = (appConfig.default_genre || [{}])[0];
        const showXmpFileInput = planningUtils.showXMPFileUIControl(this.props.value);
        const hideXmpFileInput = this.props.value.planning?.xmp_file != null;
        const readOnlyFields = planningUtils.getCoverageReadOnlyFields(
            this.props.value,
            this.props.readOnly,
            this.props.newsCoverageStatus,
            this.props.addNewsItemToPlanning
        );
        const globalProps = {
            item: this.props.value,
            language: this.props.value.planning?.language ?? this.props.language,
            onChange: this.onChange,
            errors: this.props.errors,
            readOnly: this.props.readOnly,
            disabled: this.props.readOnly,
            profile: profile,
            editorType: this.props.editorType,
        };

        const allVocabularies = superdeskApi.entities.vocabulary.getAll().toArray();
        const [_, restOfVocabularies] = partition(
            allVocabularies,
            (vocabulary) => vocabulary?.field_type === 'text'
        );

        const customCVFields = restOfVocabularies
            .filter((x) =>
                !VOCABULARIES_TO_BE_EXCLUDED.has(x._id)
                && isCustomVocabulary(x),
            )
            .reduce((prev, curr) => ({
                ...prev,
                [curr._id]: {
                    field: curr._id,
                    storageField: 'planning.subject',
                }
            }), {});

        const textFieldConfigs = Object.keys(profile.schema)
            .filter((field) => profile.schema[field]?.type === 'custom_text')
            .reduce((prev, field) => ({
                ...prev,
                [field]: {
                    field: field,
                    storageField: 'planning.fields',
                    valueStoredAsArray: true,
                },
            }), {});

        const allProfiles = coverageProfiles(planningApi.redux.store.getState());
        const coverageProfile = allProfiles.find((x) => x._id === this.props.value.profile);

        const fieldProps: Dictionary<keyof IPlanningCoverageItem, any> = {
            ...customCVFields,
            ...textFieldConfigs,
            contact_info: {
                field: 'planning.contact_info',
                assignmentField: 'assigned_to.contact',
                label: assignmentUtils.getContactLabel(this.props.value),
            },
            anpa_category: {
                field: 'planning.anpa_category',
                onChange: this.onAnpaCategoryChange,
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
            headline: {
                readOnly: this.props.readOnly || readOnlyFields.headline,
                field: 'planning.headline',
            },
            ednote: {
                readOnly: this.props.readOnly || readOnlyFields.ednote,
                field: 'planning.ednote',
            },
            location: {
                readOnly: this.props.readOnly || readOnlyFields.location,
                enableExternalSearch: !(this.props.readOnly || readOnlyFields.location),
                field: 'planning.location',
                storeAsArray: true,
            },
            keyword: {
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
                uploadFiles: this.props.uploadFiles,
                removeFile: this.props.removeFile,
                files: this.props.files,
            },
            multiple_content: {
                disabled: this.props.readOnly
                    ?? (coverageProfile.schema['multiple_content'] as IProfileSchemaTypeList).read_only,
                field: 'multiple_content',
            },
            news_coverage_status: {
                readOnly: this.props.readOnly || readOnlyFields.newsCoverageStatus,
                field: 'news_coverage_status',
            },
            scheduled: {
                readOnly: this.props.readOnly || readOnlyFields.scheduled,
                field: 'planning.scheduled',
                timeField: 'planning.scheduled',
                toBeConfirmed: this.props.value?._time_to_be_confirmed,
                onToBeConfirmed: this.onTimeToBeConfirmed,
                onChange: this.onScheduleChanged,
                canClearTime: false,
            },
            no_content_linking: {
                readOnly: this.props.readOnly || readOnlyFields.flags,
                field: 'flags.no_content_linking',
            },
            scheduled_updates: {
                onRemoveScheduledUpdate: this.onRemoveScheduledUpdate,
                onScheduleChanged: this.onScheduleChanged,
                onScheduledUpdateClose: this.onScheduledUpdateClose,
                onScheduledUpdateOpen: this.onScheduledUpdateOpen,
                onAddScheduledUpdate: this.onAddScheduledUpdate,
                canCreateScheduledUpdate: (
                    this.props.addNewsItemToPlanning == null &&
                    !get(this.props.diff, `${this.props.field}.flags.no_content_linking`)
                ),
                index: this.props.index,
                openScheduledUpdates: this.state.openScheduledUpdates,
                planning: this.props.diff,
                enabled: (
                    this.props.includeScheduledUpdates &&
                    this.props.value.planning?.g2_content_type === 'text'
                ),
                scheduledUpdates: this.props.value.scheduled_updates ?? [],
                canClearTime: false,
            },
            priority: {field: 'planning.priority'},
        };

        const isAutoAddToWorkflowOn = appConfig.planning_auto_assign_to_workflow;

        if (isAutoAddToWorkflowOn === false) {
            const shouldDisableToggle = () => {
                if (this.props.value.add_coverage_to_workflow != true) {
                    return !(isCoverageDraft(this.props.value)
                        && isCoverageAssigned(this.props.value)
                        && !isItemExpired(this.props.diff));
                } else {
                    return !planningUtils.canCancelCoverage(this.props.value, this.props.item);
                }
            };

            fieldProps.add_coverage_to_workflow = {
                onChange: this.toggleAddToWorkflow,
                planningItem: this.props.item,

                /**
                 * A coverage can be added to workflow if it is in draft state,
                 * is assigned and the associated planning item is not expired.
                 */
                disabled: shouldDisableToggle(),
            };
        }

        /**
         * `editor.dom.fields` aren't being passed anymore because we no longer have access to it
         * after decoupling this component from `IEditorAPI`.
         */
        const editorDomFields = {};

        if (isAutoAddToWorkflowOn) {
            delete searchProfile['add_coverage_to_workflow'];
        }

        return (
            <div className="coverage-editor">
                {renderFieldsForPanel(
                    'editor',
                    searchProfile,
                    globalProps,
                    fieldProps,
                    null,
                    null,
                    'enabled',
                    editorDomFields,
                    profile.schema,
                )}
            </div>
        );
    }
}

export const CoverageForm = connect<IReduxStateProps, {}, IOwnProps>(mapStateToProps)(CoverageFormComponent);
