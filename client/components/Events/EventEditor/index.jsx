import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, some} from 'lodash';
import * as selectors from '../../../selectors';
import eventsUi from '../../../actions/events/ui';

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

import '../style.scss';

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
            slugline: null,
            top: null,
            contacts: null,
        };
    }

    componentWillMount() {
        if (this.props.itemExists) {
            // Get the event with files with it
            this.props.fetchEventWithFiles(this.props.item);
        }
    }

    componentDidMount() {
        this.dom.slugline.focus();
    }

    componentDidUpdate(prevProps) {
        const prevItemId = getItemId(prevProps.item);

        const currentItemId = getItemId(this.props.item);

        // If item changed or it got locked for editing
        if ((prevItemId !== currentItemId) ||
            (!get(prevProps, 'diff.lock_user') && get(this.props, 'diff.lock_user'))) {
            this.dom.slugline.focus();
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

        if (get(this.props, 'item.files', []).filter((f) => typeof (f) === 'string'
            || f instanceof String).length > 0) {
            this.props.fetchEventWithFiles(this.props.item);
        }

        if (this.dom.top) {
            this.dom.top.scrollTop = 150;
        }
    }

    getRelatedPlanningsForEvent() {
        const {plannings, planningsModalEvent, item} = this.props;
        const itemId = getItemId(item);

        if (plannings.filter((p) => p.event_item === itemId).length > 0) {
            return plannings;
        }

        if (planningsModalEvent.filter((p) => p.event_item === itemId).length > 0) {
            return planningsModalEvent;
        }
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
            <div className="event-editor" ref={(node) => this.dom.top = node} >
                <EventEditorHeader
                    item={diff}
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
                        component={TextInput}
                        field="slugline"
                        label={gettext('Slugline')}
                        refNode={(node) => this.dom.slugline = node}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
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
                        component={SelectInput}
                        field="occur_status"
                        label={gettext('Occurrence Status')}
                        defaultValue={null}
                        options={occurStatuses}
                        {...fieldProps}
                        onFocus={onFocusEvent}
                    />

                    <Field
                        component={EventScheduleInput}
                        field="dates"
                        enabled={!itemExists}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        row={false}
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
                    />

                    <Field
                        component={GeoLookupInput}
                        field="location"
                        label={gettext('Location')}
                        {...fieldProps}
                        onFocus={onFocusEvent} />

                    <Field
                        component={ContactField}
                        field="event_contact_info"
                        label={gettext('Contacts')}
                        refNode={(node) => this.dom.contacts = node}
                        {...fieldProps}
                        onFocus={onFocusContacts}
                        paddingTop={!!onFocusContacts} />

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
                            field="place"
                            label={gettext('Place')}
                            options={locators}
                            defaultValue={[]}
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
                        />

                        {!customVocabularies.length && <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />}

                        <CustomVocabulariesFields
                            customVocabularies={customVocabularies}
                            fieldProps={fieldProps}
                            onFocusDefails={onFocusDetails}
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
                        badgeValue={get(item, 'files.length', 0) > 0 ? item.files.length : null} >
                        <Field
                            component={FileInput}
                            field="files"
                            createLink={createUploadLink}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusFiles}
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
                        badgeValue={get(item, 'links.length', 0) > 0 ? item.links.length : null}>
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
            </div>
        );
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
    planningsModalEvent: PropTypes.array,
    navigation: PropTypes.object,
    fetchEventWithFiles: PropTypes.func,
    customVocabularies: PropTypes.array,
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
    plannings: selectors.events.getRelatedPlannings(state),
    planningsModalEvent: selectors.events.getRelatedPlanningsForModalEvent(state),
    customVocabularies: state.customVocabularies,
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventWithFiles: (event) => dispatch(eventsUi.fetchEventWithFiles(event)),
});

export const EventEditor = connect(mapStateToProps, mapDispatchToProps)(EventEditorComponent);
