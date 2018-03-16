import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, some} from 'lodash';
import * as selectors from '../../../selectors';
import {EVENTS} from '../../../constants';

import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    SelectInput,
    SelectMetaTermsInput,
    TextAreaInput,
    GeoLookupInput,
    FileInput,
    InputArray,
    LinkInput,
    Field,
} from '../../UI/Form';
import {ContactField} from '../../fields';
import {ToggleBox} from '../../UI';
import {RelatedPlannings} from '../../RelatedPlannings';
import {EventScheduleInput, EventScheduleSummary} from '../';

import {EventEditorHeader} from './EventEditorHeader';
import {gettext} from '../../../utils';

import '../style.scss';

const toggleDetails = [
    'calendars',
    'anpa_category',
    'subject',
    'definition_long',
    'internal_note',
    'ednote'
];

export class EventEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {slugline: null};
    }

    componentDidMount() {
        this.dom.slugline.focus();
    }

    componentDidUpdate(prevProps) {
        // If item changed or it got locked for editing
        if ((get(prevProps, 'item._id') !== get(this.props, 'item._id')) ||
            (!get(prevProps, 'diff.lock_user') && get(this.props, 'diff.lock_user'))) {
            this.dom.slugline.focus();
        }
    }

    render() {
        const {
            item,
            diff,
            occurStatuses,
            calendars,
            locators,
            categories,
            subjects,
            createUploadLink,
            iframelyKey,
            users,
            timeFormat,
            dateFormat,
            readOnly,
            formProfile,
            submitFailed,
            dirty,
            errors,
            plannings,
            onChangeHandler,
        } = this.props;

        const existingEvent = !!get(diff, '_id');
        const detailsErrored = some(toggleDetails, (field) => !!get(errors, field));

        const fieldProps = {
            item: item,
            diff: diff,
            readOnly: readOnly,
            onChange: onChangeHandler,
            formProfile: formProfile,
            errors: errors,
            showErrors: submitFailed,
        };

        return (
            <div className="event-editor">
                <EventEditorHeader
                    item={diff}
                    users={users}
                />

                {existingEvent && (
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
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
                        {...fieldProps}
                    />

                    <Field
                        component={TextAreaInput}
                        field="definition_short"
                        label={gettext('Description')}
                        {...fieldProps}
                    />

                    <Field
                        component={SelectInput}
                        field="occur_status"
                        label={gettext('Occurrence Status')}
                        defaultValue={EVENTS.DEFAULT_VALUE(occurStatuses).occur_status}
                        options={occurStatuses}
                        {...fieldProps}
                    />

                    <Field
                        component={EventScheduleInput}
                        field="dates"
                        enabled={!existingEvent}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        {...fieldProps}
                    />

                    <Field
                        component={GeoLookupInput}
                        field="location"
                        label={gettext('Location')}
                        {...fieldProps}
                    />

                    <Field
                        component={ContactField}
                        field="event_contact_info"
                        label={gettext('Contact')}
                        {...fieldProps}
                    />

                    <ToggleBox
                        title={gettext('Details')}
                        isOpen={false}
                        scrollInView={true}
                        invalid={detailsErrored && (dirty || submitFailed)}
                    >
                        <Field
                            component={SelectMetaTermsInput}
                            field="calendars"
                            label={gettext('Calendars')}
                            options={calendars}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="place"
                            label={gettext('Place')}
                            options={locators}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="anpa_category"
                            label={gettext('Category')}
                            options={categories}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={TextAreaInput}
                            field="definition_long"
                            label={gettext('Long Description')}
                            {...fieldProps}
                        />

                        <Field
                            component={TextAreaInput}
                            field="internal_note"
                            label={gettext('Internal Note')}
                            {...fieldProps}
                        />

                        <Field
                            component={TextAreaInput}
                            field="ednote"
                            label={gettext('Ed Note')}
                            noMargin={true}
                            {...fieldProps}
                        />
                    </ToggleBox>

                    <ToggleBox
                        title={gettext('Attached Files')}
                        isOpen={false}
                        scrollInView={true}
                        hideUsingCSS={true} // hideUsingCSS so the file data is kept on hide/show
                        invalid={!!errors.files && (dirty || submitFailed)}
                    >
                        <Field
                            component={InputArray}
                            field="files"
                            createLink={createUploadLink}
                            addButtonText={gettext('Add a file')}
                            element={FileInput}
                            defaultValue={[]}
                            {...fieldProps}
                        />
                    </ToggleBox>

                    <ToggleBox
                        title={gettext('External Links')}
                        isOpen={false}
                        scrollInView={true}
                        invalid={!!errors.links && (dirty || submitFailed)}
                    >
                        <Field
                            component={InputArray}
                            field="links"
                            iframelyKey={iframelyKey}
                            defaultValue={[]}
                            defaultElement=""
                            addButtonText={gettext('Add a link')}
                            element={LinkInput}
                            {...fieldProps}
                        />
                    </ToggleBox>

                    <ToggleBox title="Related Planning Items" isOpen={false} scrollInView={true}>
                        {get(plannings, 'length', 0) > 0 && (
                            <RelatedPlannings
                                plannings={plannings}
                                openPlanningItem={true}
                            />
                        ) ||
                        (
                            <span className="sd-text__info">{gettext('No related planning items.')}</span>
                        )}
                    </ToggleBox>
                </ContentBlock>
            </div>
        );
    }
}

EventEditorComponent.propTypes = {
    item: PropTypes.object,
    diff: PropTypes.object.isRequired,
    onChangeHandler: PropTypes.func.isRequired,
    formProfile: PropTypes.object.isRequired,
    occurStatuses: PropTypes.array,
    calendars: PropTypes.array,
    locators: PropTypes.array,
    categories: PropTypes.array,
    subjects: PropTypes.array,
    createUploadLink: PropTypes.func,
    iframelyKey: PropTypes.string,
    users: PropTypes.array,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    submitFailed: PropTypes.bool,
    dirty: PropTypes.bool,
    errors: PropTypes.object,
    plannings: PropTypes.array,
};

EventEditorComponent.defaultProps = {
    readOnly: false,
    submitFailed: false,
};

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventProfile(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    calendars: selectors.getEventCalendars(state),
    locators: selectors.vocabs.locators(state),
    categories: selectors.vocabs.categories(state),
    subjects: selectors.vocabs.subjects(state),
    createUploadLink: (f) => selectors.config.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw',
    iframelyKey: selectors.getIframelyKey(state),
    users: selectors.getUsers(state),
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
    plannings: selectors.events.getRelatedPlannings(state),
});

export const EventEditor = connect(mapStateToProps)(EventEditorComponent);
