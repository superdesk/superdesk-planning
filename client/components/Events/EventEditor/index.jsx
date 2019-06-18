import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, some, isEqual} from 'lodash';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    SelectInput,
    SelectMetaTermsInput,
    TextAreaInput,
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
import {gettext, editorMenuUtils, getItemId} from '../../../utils';
import CustomVocabulariesFields from '../../CustomVocabulariesFields';

const toggleDetails = [
    'anpa_category',
    'subject',
    'definition_long',
    'internal_note',
    'ednote',
];

export class EventEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {
            initialFocus: null,
            top: null,
            contacts: null,
            uploading: false,
        };

        this.onAddFiles = this.onAddFiles.bind(this);
        this.onRemoveFile = this.onRemoveFile.bind(this);
    }

    componentWillMount() {
        this.props.fetchEventFiles({...this.props.item, ...this.props.diff});
    }

    componentWillUpdate(nextProps) {
        if (getItemId(this.props.item) !== getItemId(nextProps.item)) {
            this.props.fetchEventFiles({...nextProps.item, ...nextProps.diff});
        } else if (get(this.props, 'diff.files') !== get(nextProps, 'diff.files')) {
            this.props.fetchEventFiles({...nextProps.item, ...nextProps.diff});
        }
    }

    componentDidMount() {
        if (!get(this.props, 'navigation.scrollToViewItem') && this.dom.initialFocus) {
            this.dom.initialFocus.focus();
            var tempValue = get(this.dom.initialFocus, 'value', '');

            this.dom.initialFocus.value = '';
            this.dom.initialFocus.value = tempValue;
        }

        // scroll to contacts
        if (editorMenuUtils.forceScroll(this.props.navigation, 'contacts')) {
            this.dom.contacts.scrollIntoView();
        }
    }

    componentDidUpdate(prevProps) {
        const prevItemId = getItemId(prevProps.item);

        const currentItemId = getItemId(this.props.item);

        // If item changed or it got locked for editing
        if (((prevItemId !== currentItemId) ||
            (!get(prevProps, 'diff.lock_user') && get(this.props, 'diff.lock_user'))) && this.dom.initialFocus) {
            this.dom.initialFocus.focus();
        }

        if (get(prevProps, 'navigation.scrollToViewItem') !== get(this.props, 'navigation.scrollToViewItem')) {
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

    componentWillReceiveProps(nextProps) {
        // If 'Create Planning Item' was actioned while open in the editor
        // Then force update the initial values with the new list of ids
        if (!isEqual(
            get(this.props, 'original.planning_ids'),
            get(nextProps, 'original.planning_ids'))
        ) {
            this.props.itemManager.forceUpdateInitialValues({
                planning_ids: get(nextProps, 'original.planning_ids'),
            });
        }
    }

    getRelatedPlanningsForEvent() {
        const {plannings, item} = this.props;
        const itemId = getItemId(item);

        if (plannings.filter((p) => p.event_item === itemId).length > 0) {
            return plannings;
        }
    }

    onAddFiles(fileList) {
        const files = Array.from(fileList).map((f) => [f]);

        this.dom.uploading = true;
        this.props.uploadFiles(files)
            .then((newFiles) => {
                this.props.onChangeHandler('files',
                    [
                        ...get(this.props, 'diff.files', []),
                        ...newFiles.map((f) => f._id),
                    ]);
                this.dom.uploading = false;
            }, () => {
                this.notifyValidationErrors('Failed to upload files');
                this.dom.uploading = false;
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
        const {
            item,
            diff,
            occurStatuses,
            enabledCalendars,
            locators,
            categories,
            subjects,
            createUploadLink,
            iframelyKey,
            users,
            desks,
            timeFormat,
            dateFormat,
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

        const detailsErrored = some(toggleDetails, (field) => !!get(errors, field));
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
            const count = get(this.props, `diff.${propertyName}.length`, 0);

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

        return this.dom.uploading ? (<div className="sd-loader"/>) :
            (<div ref={(node) => this.dom.top = node} >
                <EventEditorHeader
                    item={item}
                    users={users}
                />

                {itemExists && (
                    <ContentBlock padSmall={true}>
                        <EventScheduleSummary
                            schedule={get(diff, 'dates', {})}
                            noPadding={true}
                        />
                    </ContentBlock>
                )}

                <ContentBlock>
                    <Field
                        component={EventScheduleInput}
                        field="dates"
                        enabled={!itemExists}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        row={false}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                        showTimeZone={!itemExists}
                        {...popupProps}
                        refNode={!itemExists ? (node) => this.dom.initialFocus = node : undefined}
                    />

                    <Field
                        component={TextInput}
                        field="slugline"
                        label={gettext('Slugline')}
                        refNode={itemExists && get(formProfile, 'editor.slugline.enabled') ?
                            (node) => this.dom.initialFocus = node : undefined}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Event name')}
                        refNode={get(formProfile, 'editor.slugline.enabled') || !itemExists ? undefined :
                            (node) => this.dom.initialFocus = node}
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
                        {...popupProps} />

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
                        paddingTop={!!onFocusDetails} >
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

                        {!!get(formProfile, 'editor.subject.enabled') && <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                            popupContainer={this.props.popupContainer}
                            {...popupProps}
                        />}

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
                            component={TextAreaInput}
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
                        badgeValue={getCountOfProperty('files')} >
                        <Field
                            component={FileInput}
                            field="files"
                            createLink={createUploadLink}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusFiles}
                            files={files}
                            onAddFiles={this.onAddFiles}
                            onRemoveFile={this.onRemoveFile}
                        />
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
                        badgeValue={getCountOfProperty('links')}>
                        <Field
                            component={InputArray}
                            field="links"
                            iframelyKey={iframelyKey}
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

                    {relatedPlannings && (
                        <h3 className="side-panel__heading side-panel__heading--big">
                            {gettext('Related Planning Items')}
                        </h3>
                    )}
                    {get(relatedPlannings, 'length', 0) > 0 && (
                        <RelatedPlannings
                            plannings={relatedPlannings}
                            openPlanningItem={true}
                            onFocus={onFocusPlannings}
                            expandable={true}
                            navigation={navigation}
                            users={users}
                            desks={desks}
                            timeFormat={timeFormat}
                            dateFormat={dateFormat}
                        />
                    )}
                </ContentBlock>
            </div>);
    }
}

EventEditorComponent.propTypes = {
    item: PropTypes.object,
    diff: PropTypes.object.isRequired,
    itemExists: PropTypes.bool,
    onChangeHandler: PropTypes.func.isRequired,
    formProfile: PropTypes.object.isRequired,
    occurStatuses: PropTypes.array,
    enabledCalendars: PropTypes.array,
    defaultCalendar: PropTypes.array,
    locators: PropTypes.array,
    categories: PropTypes.array,
    subjects: PropTypes.array,
    createUploadLink: PropTypes.func,
    iframelyKey: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    submitFailed: PropTypes.bool,
    dirty: PropTypes.bool,
    errors: PropTypes.object,
    plannings: PropTypes.array,
    navigation: PropTypes.object,
    fetchEventFiles: PropTypes.func,
    customVocabularies: PropTypes.array,
    files: PropTypes.object,
    uploadFiles: PropTypes.func,
    removeFile: PropTypes.func,
    popupContainer: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    itemManager: PropTypes.object,
    original: PropTypes.object,
};

EventEditorComponent.defaultProps = {
    readOnly: false,
    submitFailed: false,
    navigation: {},
};

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventProfile(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    enabledCalendars: selectors.events.enabledCalendars(state),
    defaultCalendar: selectors.events.defaultCalendarValue(state),
    locators: selectors.vocabs.locators(state),
    categories: selectors.vocabs.categories(state),
    subjects: selectors.vocabs.subjects(state),
    createUploadLink: (f) => selectors.config.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw',
    iframelyKey: selectors.config.getIframelyKey(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
    customVocabularies: state.customVocabularies,
    files: selectors.general.files(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    uploadFiles: (files) => dispatch(actions.events.api.uploadFiles({files: files})),
    removeFile: (file) => dispatch(actions.events.api.removeFile(file)),
});

export const EventEditor = connect(mapStateToProps, mapDispatchToProps)(EventEditorComponent);
