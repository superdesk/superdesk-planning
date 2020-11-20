import React from 'react';
import {connect} from 'react-redux';
import {some, isEqual} from 'lodash';

import {IDesk, ISubject, IUser, IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {
    IEventFormProfile,
    IEventItem,
    IEventOccurStatus,
    ICalendar,
    IANPACategory,
    IPlanningItem,
    IFile,
} from '../../../interfaces';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {editorMenuUtils, getItemId, getFileDownloadURL} from '../../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    SelectInput,
    SelectMetaTermsInput,
    TextAreaInput,
    ExpandableTextAreaInput,
    FileInput,
    InputArray,
    LinkInput,
    Field,
} from '../../UI/Form';
import {ContactField} from '../../Contacts';
import {ToggleBox, IconButton} from '../../UI';
import {RelatedPlannings} from '../../RelatedPlannings';
import {EventScheduleInput, EventScheduleSummary} from '../';
import {GeoLookupInput} from '../../index';
import {EventEditorHeader} from './EventEditorHeader';
import CustomVocabulariesFields from '../../CustomVocabulariesFields';

const toggleDetails = [
    'anpa_category',
    'subject',
    'definition_long',
    'internal_note',
    'ednote',
];

interface IProps {
    item?: IEventItem;
    diff: Partial<IEventItem>;
    itemExists: boolean;
    onChangeHandler(field: string, value: any): void;
    formProfile: IEventFormProfile;
    occurStatuses: Array<IEventOccurStatus>;
    languages: Array<string>;
    enabledCalendars: Array<ICalendar>;
    defaultCalendar: Array<ICalendar>;
    locators: Array<any>; // TODO - Change to match code
    categories: Array<IANPACategory>;
    subjects: Array<ISubject>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    readOnly: boolean;
    submitting: boolean;
    submitFailed: boolean;
    dirty: boolean;
    errors: {[key: string]: string};
    plannings: Array<IPlanningItem>;
    navigation?: {
        scrollToViewItem?: any;
        contacts?: any;
        event?: any;
        details?: any;
        files?: any;
        links?: any;
        planning?: any;
    };
    fetchEventFiles(event: IEventItem): Promise<void>;
    customVocabularies: Array<IVocabulary>;
    files: Array<IFile>;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    removeFile(file: IFile): Promise<void>;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
    itemManager: {
        forceUpdateInitialValues(updates: Partial<IEventItem>): void;
    };
    original?: IEventItem;
    notifyValidationErrors(errors: Array<string>): void;
}

interface IState {
    uploading: boolean;
}

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventProfile(state),
    languages: selectors.vocabs.getLanguages(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    enabledCalendars: selectors.events.enabledCalendars(state),
    defaultCalendar: selectors.events.defaultCalendarValue(state),
    locators: selectors.vocabs.locators(state),
    categories: selectors.vocabs.categories(state),
    subjects: selectors.vocabs.subjects(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    customVocabularies: state.customVocabularies,
    files: selectors.general.files(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    uploadFiles: (files) => dispatch(actions.events.api.uploadFiles({files: files})),
    removeFile: (file) => dispatch(actions.events.api.removeFile(file)),
});

export class EventEditorComponent extends React.Component<IProps, IState> {
    dom: {
        initialFocus?: HTMLInputElement;
        top?: HTMLDivElement;
        contacts?: any;
    };

    constructor(props) {
        super(props);

        this.dom = {
            initialFocus: null,
            top: null,
            contacts: null,
        };

        this.state = {uploading: false};
        this.onAddFiles = this.onAddFiles.bind(this);
        this.onRemoveFile = this.onRemoveFile.bind(this);
    }

    componentWillMount() {
        this.props.fetchEventFiles({...this.props.item, ...this.props.diff});
    }

    componentWillUpdate(nextProps: Readonly<IProps>) {
        if (getItemId(this.props.item) !== getItemId(nextProps.item)) {
            this.props.fetchEventFiles({...nextProps.item, ...nextProps.diff});
        } else if (this.props.diff.files !== nextProps.diff.files) {
            this.props.fetchEventFiles({...nextProps.item, ...nextProps.diff});
        }
    }

    componentDidMount() {
        if (this.props.navigation?.scrollToViewItem == null && this.dom.initialFocus != null) {
            this.dom.initialFocus.focus();
            var tempValue = this.dom.initialFocus?.value ?? '';

            this.dom.initialFocus.value = '';
            this.dom.initialFocus.value = tempValue;
        }

        // scroll to contacts
        if (editorMenuUtils.forceScroll(this.props.navigation, 'contacts')) {
            this.dom.contacts.scrollIntoView();
        }
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        const prevItemId = getItemId(prevProps.item);

        const currentItemId = getItemId(this.props.item);

        // If item changed or it got locked for editing
        if (((prevItemId !== currentItemId) ||
            (prevProps.diff.lock_user == null && this.props.diff.lock_user != null)) && this.dom.initialFocus != null) {
            this.dom.initialFocus.focus();
        }

        if (prevProps.navigation?.scrollToViewItem !== this.props.navigation?.scrollToViewItem) {
            // scroll to new position
            if (editorMenuUtils.forceScroll(this.props.navigation, 'event')) {
                this.dom.top.scrollIntoView();
            }

            // scroll to contacts
            if (editorMenuUtils.forceScroll(this.props.navigation, 'contacts')) {
                this.dom.contacts.scrollIntoView();
            }
        }

        if (this.dom.top) {
            this.dom.top.scrollTop = 150;
        }
    }

    componentWillReceiveProps(nextProps: Readonly<IProps>) {
        // If 'Create Planning Item' was actioned while open in the editor
        // Then force update the initial values with the new list of ids
        if (!isEqual(this.props.original?.planning_ids, nextProps.original?.planning_ids)) {
            this.props.itemManager.forceUpdateInitialValues({
                planning_ids: nextProps.original?.planning_ids,
            });
        }
    }

    getRelatedPlanningsForEvent(): Array<IPlanningItem> {
        const {plannings, item} = this.props;
        const itemId = getItemId(item);

        if (plannings.filter((p) => p.event_item === itemId).length > 0) {
            return plannings;
        }

        return [];
    }

    onAddFiles(fileList: FileList) {
        const files = Array.from(fileList).map((f) => [f]);

        this.setState({uploading: true});
        this.props.uploadFiles(files)
            .then((newFiles) => {
                this.props.onChangeHandler('files',
                    [
                        ...(this.props.diff.files ?? []),
                        ...newFiles.map((f) => f._id),
                    ]);
                this.setState({uploading: false});
            }, () => {
                this.props.notifyValidationErrors(['Failed to upload files']);
                this.setState({uploading: false});
            });
    }

    onRemoveFile(file: IFile) {
        const promise = !(this.props.item?.files ?? []).includes(file._id) ?
            this.props.removeFile(file) :
            Promise.resolve();

        promise.then(() =>
            this.props.onChangeHandler(
                'files',
                (this.props.diff.files ?? [])
                    .filter((f) => f !== file._id)
            )
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            diff,
            occurStatuses,
            languages,
            enabledCalendars,
            locators,
            categories,
            subjects,
            users,
            desks,
            readOnly,
            formProfile,
            submitFailed,
            dirty,
            errors,
            onChangeHandler,
            navigation,
            itemExists,
            customVocabularies,
            files,
            onPopupOpen,
            onPopupClose,
        } = this.props;

        const detailsErrored = some(toggleDetails, (field) => errors?.[field] != null);
        const relatedPlannings = this.getRelatedPlanningsForEvent();

        const onFocusEvent = editorMenuUtils.onItemFocus(this.props.navigation, 'event');
        const onFocusContacts = editorMenuUtils.onItemFocus(this.props.navigation, 'contacts');
        const onFocusDetails = editorMenuUtils.onItemFocus(this.props.navigation, 'details');
        const onFocusFiles = editorMenuUtils.onItemFocus(this.props.navigation, 'files');
        const onFocusLinks = editorMenuUtils.onItemFocus(this.props.navigation, 'links');
        const onFocusPlannings = editorMenuUtils.onItemFocus(this.props.navigation, 'planning');

        const fieldProps = {
            item: item,
            diff: diff,
            readOnly: readOnly,
            onChange: onChangeHandler,
            formProfile: formProfile,
            errors: errors,
            showErrors: submitFailed,
        };

        const popupProps = {
            onPopupOpen,
            onPopupClose,
        };

        const getCountOfProperty = (propertyName) => {
            const count = this.props.diff?.[propertyName]?.length ?? 0;

            return count > 0 ? count : null;
        };

        const AddLinkButton = ({onAdd}) => (
            <IconButton
                onClick={onAdd}
                icon="icon-plus-sign"
                label={gettext('Add link')}
                useDefaultClass={false}
                className="text-link cursor-pointer link-input__add-btn"
                tabIndex={0}
                enterKeyIsClick={true}
            />
        );

        return (
            <div ref={(node) => this.dom.top = node} >
                <EventEditorHeader
                    item={item}
                    users={users}
                />

                {itemExists && (
                    <ContentBlock padSmall={true}>
                        <EventScheduleSummary
                            schedule={{
                                dates: diff?.dates ?? {},
                                [TO_BE_CONFIRMED_FIELD]: diff?.[TO_BE_CONFIRMED_FIELD],
                            }}
                            noPadding={true}
                        />
                    </ContentBlock>
                )}

                <ContentBlock>
                    <Field
                        component={EventScheduleInput}
                        field="dates"
                        enabled={!itemExists}
                        row={false}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                        showTimeZone={!itemExists}
                        {...popupProps}
                        refNode={!itemExists ? (node) => this.dom.initialFocus = node : undefined}
                    />

                    <Field
                        component={SelectInput}
                        field="language"
                        label={gettext('Language')}
                        defaultValue={null}
                        options={languages}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                        labelField={'name'}
                        clearable={true}
                        valueAsString={true}
                        enabled={formProfile.editor.language.enabled}
                    />

                    <Field
                        component={TextInput}
                        field="slugline"
                        label={gettext('Slugline')}
                        refNode={itemExists && formProfile.editor.slugline.enabled ?
                            (node) => this.dom.initialFocus = node :
                            undefined
                        }
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Event name')}
                        refNode={formProfile.editor.slugline.enabled || !itemExists ?
                            undefined :
                            (node) => this.dom.initialFocus = node
                        }
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={TextAreaInput}
                        field="definition_short"
                        label={gettext('Description')}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={TextInput}
                        field="reference"
                        label={gettext('External Reference')}
                        enabled={formProfile.editor.reference.enabled}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="calendars"
                        label={gettext('Calendars')}
                        options={enabledCalendars}
                        defaultValue={[]}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                        popupContainer={this.props.popupContainer}
                        {...popupProps}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="place"
                        label={gettext('Place')}
                        options={locators}
                        defaultValue={[]}
                        {...fieldProps}
                        onFocus={onFocusDetails}
                        popupContainer={this.props.popupContainer}
                        {...popupProps}
                    />

                    <Field
                        component={GeoLookupInput}
                        field="location"
                        label={gettext('Location')}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                        popupContainer={this.props.popupContainer}
                        {...popupProps}
                    />

                    <Field
                        component={ContactField}
                        field="event_contact_info"
                        label={gettext('Contacts')}
                        refNode={(node) => this.dom.contacts = node}
                        defaultValue={[]}
                        {...fieldProps}
                        onFocus={onFocusContacts}
                        paddingTop={!!onFocusContacts}
                        {...popupProps}
                    />

                    <Field
                        component={SelectInput}
                        field="occur_status"
                        label={gettext('Occurrence Status')}
                        defaultValue={null}
                        options={occurStatuses}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <ToggleBox
                        title={gettext('Details')}
                        isOpen={editorMenuUtils.isOpen(navigation, 'details')}
                        onClose={editorMenuUtils.onItemClose(navigation, 'details')}
                        onOpen={editorMenuUtils.onItemOpen(navigation, 'details')}
                        scrollInView={true}
                        invalid={detailsErrored && (dirty || submitFailed)}
                        forceScroll={editorMenuUtils.forceScroll(navigation, 'details')}
                        paddingTop={!!onFocusDetails}
                    >
                        <Field
                            component={SelectMetaTermsInput}
                            field="anpa_category"
                            label={gettext('ANPA Category')}
                            options={categories}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                            popupContainer={this.props.popupContainer}
                            {...popupProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                            popupContainer={this.props.popupContainer}
                            {...popupProps}
                        />

                        <CustomVocabulariesFields
                            customVocabularies={customVocabularies}
                            fieldProps={fieldProps}
                            popupProps={popupProps}
                            popupContainer={this.props.popupContainer}
                            onFocusDefails={onFocusDetails}
                            formProfile={formProfile}
                        />

                        <Field
                            component={TextAreaInput}
                            field="definition_long"
                            label={gettext('Long Description')}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        <Field
                            component={ExpandableTextAreaInput}
                            field="internal_note"
                            label={gettext('Internal Note')}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        <Field
                            component={TextAreaInput}
                            field="ednote"
                            label={gettext('Ed Note')}
                            noMargin={true}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />
                    </ToggleBox>

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

                    <ToggleBox
                        title={gettext('External Links')}
                        isOpen={editorMenuUtils.isOpen(navigation, 'links')}
                        onClose={editorMenuUtils.onItemClose(navigation, 'links')}
                        onOpen={editorMenuUtils.onItemOpen(navigation, 'links')}
                        scrollInView={true}
                        invalid={!!errors.links && (dirty || submitFailed)}
                        forceScroll={editorMenuUtils.forceScroll(navigation, 'links')}
                        paddingTop={!!onFocusLinks}
                        badgeValue={getCountOfProperty('links')}
                    >
                        <Field
                            component={InputArray}
                            field="links"
                            defaultValue={[]}
                            defaultElement=""
                            addButtonText={gettext('Add a link')}
                            element={LinkInput}
                            addButtonComponent={AddLinkButton}
                            row={false}
                            {...fieldProps}
                            onFocus={onFocusLinks}
                        />
                    </ToggleBox>

                    {relatedPlannings.length === 0 ? null : (
                        <React.Fragment>
                            <h3 className="side-panel__heading side-panel__heading--big">
                                {gettext('Related Planning Items')}
                            </h3>
                            <RelatedPlannings
                                plannings={relatedPlannings}
                                openPlanningItem={true}
                                onFocus={onFocusPlannings}
                                expandable={true}
                                navigation={navigation}
                                users={users}
                                desks={desks}
                            />
                        </React.Fragment>
                    )}
                </ContentBlock>
            </div>
        );
    }
}

export const EventEditor = connect(mapStateToProps, mapDispatchToProps)(EventEditorComponent);
