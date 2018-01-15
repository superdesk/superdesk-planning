import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import * as selectors from '../../../selectors';

import {ContentBlock} from '../../UI/SidePanel';
import {
    Row,
    TextInput,
    SelectInput,
    SelectMetaTermsInput,
    TextAreaInput,
    GeoLookupInput,
    FileInput,
    InputArray,
    LinkInput,
} from '../../UI/Form';
import {ContactField} from '../../fields';
import {ToggleBox} from '../../UI';
import {RelatedPlannings} from '../../RelatedPlannings';
import {EventScheduleInput, EventScheduleSummary} from '../';

import {EventEditorHeader} from './EventEditorHeader';

import '../style.scss';

export class EventEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {slugline: null};
        this.onChange = this.onChange.bind(this);
    }

    onChange(field, value) {
        this.props.onChangeHandler(field, value);
    }

    componentDidMount() {
        this.dom.slugline.focus();
    }

    render() {
        const {
            item,
            diff,
            occurStatuses,
            calendars,
            categories,
            subjects,
            createUploadLink,
            iframelyKey,
            users,
            timeFormat,
            dateFormat,
            readOnly,
            maxRecurrentEvents
        } = this.props;

        const existingEvent = !!get(diff, '_id');

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
                    <Row>
                        <TextInput
                            field="slugline"
                            label="Slugline"
                            value={get(diff, 'slugline', '')}
                            onChange={this.onChange}
                            maxChars={15}
                            refNode={(node) => this.dom.slugline = node}
                            readOnly={readOnly}
                        />
                    </Row>
                    <Row>
                        <TextInput
                            field="name"
                            label="Name"
                            value={get(diff, 'name', '')}
                            onChange={this.onChange}
                            readOnly={readOnly}
                        />
                    </Row>
                    <Row>
                        <TextAreaInput
                            field="definition_short"
                            label="Description"
                            value={get(diff, 'definition_short', '')}
                            onChange={this.onChange}
                            readOnly={readOnly}
                        />
                    </Row>
                    <Row>
                        <SelectInput
                            field="occur_status"
                            label="Occurrence Status"
                            value={get(diff, 'occur_status', {qcode: 'eocstat:eos5'})}
                            onChange={this.onChange}
                            options={occurStatuses}
                            noMargin={true}
                            readOnly={readOnly}
                        />
                    </Row>

                    {!existingEvent && (
                        <EventScheduleInput
                            item={item}
                            diff={diff}
                            onChange={this.onChange}
                            timeFormat={timeFormat}
                            dateFormat={dateFormat}
                            maxRecurrentEvents={maxRecurrentEvents}
                            readOnly={readOnly}
                        />
                    )}

                    <Row>
                        <GeoLookupInput
                            field="location[0]"
                            label="Location"
                            value={get(diff, 'location[0]', null)}
                            onChange={this.onChange}
                            readOnly={readOnly}
                        />
                    </Row>

                    <Row>
                        <ContactField
                            field="event_contact_info"
                            label="Contact"
                            value={get(diff, 'event_contact_info', [])}
                            onChange={this.onChange} />
                    </Row>

                    <ToggleBox title="Details" isOpen={false} scrollInView={true}>
                        <Row>
                            <SelectMetaTermsInput
                                field="calendars"
                                label="Calendars"
                                value={get(diff, 'calendars', [])}
                                onChange={this.onChange}
                                options={calendars}
                                readOnly={readOnly}
                            />
                        </Row>
                        <Row>
                            <SelectMetaTermsInput
                                field="anpa_category"
                                label="Category"
                                value={get(diff, 'anpa_category', [])}
                                onChange={this.onChange}
                                options={categories}
                                readOnly={readOnly}
                            />
                        </Row>
                        <Row>
                            <SelectMetaTermsInput
                                field="subject"
                                label="Subject"
                                value={get(diff, 'subject', [])}
                                onChange={this.onChange}
                                options={subjects}
                                readOnly={readOnly}
                            />
                        </Row>
                        <Row>
                            <TextAreaInput
                                field="definition_long"
                                label="Long Description"
                                value={get(diff, 'definition_long', '')}
                                onChange={this.onChange}
                                readOnly={readOnly}
                            />
                        </Row>
                        <Row>
                            <TextAreaInput
                                field="internal_note"
                                label="Internal Note"
                                value={get(diff, 'internal_note', '')}
                                onChange={this.onChange}
                                noMargin={true}
                                readOnly={readOnly}
                            />
                        </Row>
                    </ToggleBox>

                    <ToggleBox
                        title="Attached Files"
                        isOpen={false}
                        scrollInView={true}
                        hideUsingCSS={true} // hideUsingCSS so the file data is kept on hide/show
                    >
                        <InputArray
                            field="files"
                            value={get(diff, 'files', [])}
                            onChange={this.onChange}
                            createLink={createUploadLink}
                            addButtonText="Add a file"
                            component={FileInput}
                            readOnly={readOnly}
                        />
                    </ToggleBox>

                    <ToggleBox title="External Links" isOpen={false} scrollInView={true}>
                        <InputArray
                            field="links"
                            value={get(diff, 'links', [])}
                            onChange={this.onChange}
                            addButtonText="Add a link"
                            component={LinkInput}
                            iframelyKey={iframelyKey}
                            defaultValue=""
                            readOnly={readOnly}
                        />
                    </ToggleBox>

                    <ToggleBox title="Related Planning Items" isOpen={false} scrollInView={true}>
                        {get(diff, '_plannings.length', 0) > 0 && (
                            <RelatedPlannings
                                plannings={diff._plannings}
                                openPlanningItem={true}
                            />
                        ) ||
                        (
                            <span className="sd-text__info">No related planning items.</span>
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
    categories: PropTypes.array,
    subjects: PropTypes.array,
    createUploadLink: PropTypes.func,
    iframelyKey: PropTypes.string,
    users: PropTypes.array,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    maxRecurrentEvents: PropTypes.number
};

EventEditorComponent.defaultProps = {readOnly: false};

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventProfile(state),
    occurStatuses: state.vocabularies.eventoccurstatus,
    calendars: selectors.getEventCalendars(state),
    categories: state.vocabularies.categories,
    subjects: state.subjects,
    createUploadLink: (f) => selectors.config.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw',
    iframelyKey: selectors.getIframelyKey(state),
    users: selectors.getUsers(state),
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
    maxRecurrentEvents: selectors.config.getMaxRecurrentEvents(state)
});

export const EventEditor = connect(mapStateToProps)(EventEditorComponent);
