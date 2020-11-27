import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, isEqual, cloneDeep, omit, isEmpty} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';

import * as actions from '../../../actions';
import {formProfile, validateItem} from '../../../validators';
import * as selectors from '../../../selectors';
import {gettext, eventUtils, getDateTimeString, updateFormValues, timeUtils} from '../../../utils';
import {EVENTS, ITEM_TYPE, TIME_COMPARISON_GRANULARITY, TO_BE_CONFIRMED_FIELD} from '../../../constants';

import {EventScheduleSummary, EventScheduleInput} from '../../Events';
import {RelatedPlannings} from '../../';
import {Row} from '../../UI/Preview';
import {TextAreaInput, Field} from '../../UI/Form';

import '../style.scss';

export class RescheduleEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            reason: '',
            errors: {},
            multiDayChanged: false,
            reasonInvalid: false,
            datesInvalid: false,
        };

        this.onReasonChange = this.onReasonChange.bind(this);
        this.onDatesChange = this.onDatesChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);
        this.enableDisableSave = this.enableDisableSave.bind(this);

        this.dom = {popupContainer: null};
    }

    componentWillMount() {
        const dates = cloneDeep(this.props.original.dates);
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(this.props.original || {});

        if (isRemoteTimeZone) {
            dates.start = timeUtils.getDateInRemoteTimeZone(dates.start, dates.tz);
            dates.end = timeUtils.getDateInRemoteTimeZone(dates.end, dates.tz);
        }

        let reasonInvalid = false;

        if (get(this.props.rescheduleProfile, 'schema.reason.required', false)) {
            reasonInvalid = true;
        }

        this.setState({
            diff: {
                dates: dates,
                _startTime: cloneDeep(dates.start),
                _endTime: cloneDeep(dates.end),
                [TO_BE_CONFIRMED_FIELD]: this.props.original[TO_BE_CONFIRMED_FIELD],
            },
            reasonInvalid: reasonInvalid,
        });
    }

    onReasonChange(field, reason) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];
        let reasonInvalid = false;

        if (this.props.rescheduleProfile) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.props.rescheduleProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (get(errorMessages, 'length', 0) > 0 ||
                (get(this.props.rescheduleProfile, 'schema.reason.required', false) && isEmpty(reason))) {
                reasonInvalid = true;
            } else {
                reasonInvalid = false;
            }
        }

        this.setState({
            reason,
            errors,
            reasonInvalid,
        }, this.enableDisableSave);
    }

    enableDisableSave() {
        if (this.state.reasonInvalid || this.state.datesInvalid) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    onDatesChange(field, val) {
        const diff = cloneDeep(get(this.state, 'diff') || {});
        const original = this.props.original;
        let datesInvalid = false;

        if (typeof diff.dates === 'object' && !diff.dates.tz) {
            // if no timezone use default one
            diff.dates.tz = appConfig.defaultTimezone;
        }

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
        } else {
            updateFormValues(diff, field, val);
        }

        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];
        const fieldsToValidate = Object.keys(diff);

        this.props.onValidate(
            omit(diff, 'dates.recurring_rule'), // Omit recurring rules as we reschedule only single instance
            this.props.formProfiles,
            errors,
            errorMessages,
            fieldsToValidate // Validate only those fields which can change while rescheduling.
        );

        const multiDayChanged = eventUtils.isEventSameDay(original.dates.start, original.dates.end) &&
            !eventUtils.isEventSameDay(diff.dates.start, diff.dates.end);

        if ((!diff[TO_BE_CONFIRMED_FIELD] &&
            eventUtils.eventsDatesSame(diff, original, TIME_COMPARISON_GRANULARITY.MINUTE)) ||
            (diff.dates.recurring_rule &&
            !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            !isEqual(errorMessages, [])
        ) {
            datesInvalid = true;
        } else {
            datesInvalid = false;
        }

        this.setState({
            diff,
            errors,
            multiDayChanged,
            datesInvalid,
        }, this.enableDisableSave);
    }

    submit() {
        const reason = this.state.reason ? (gettext('Event Rescheduled: ') + this.state.reason) :
            this.state.reason;

        return this.props.onSubmit(
            this.props.original,
            {
                ...this.state.diff,
                reason: reason,
            },
            get(this.props, 'modalProps.onCloseModal')
        );
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {original, formProfiles, submitting} = this.props;
        let reasonLabel = gettext('Reason for rescheduling this event:');
        const numPlannings = get(original, '_plannings.length');
        const afterUntil = moment.isMoment(get(original, 'dates.recurring_rule.until')) &&
            moment.isMoment(get(this.state, 'diff.dates.start')) &&
            this.state.diff.dates.start.isAfter(original.dates.recurring_rule.until);
        const timeZone = get(original, 'dates.tz') || appConfig.defaultTimezone;
        const dateFormat = appConfig.planning.dateformat;
        const timeFormat = appConfig.planning.timeformat;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={this.props.original.dates}
                    noPadding={true}
                    forUpdating={true}
                    useEventTimezone={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('Planning Items')}
                    value={numPlannings}
                    noPadding={true}
                />

                {numPlannings > 0 && (
                    <div>
                        <div className="sd-alert sd-alert--hollow sd-alert--alert sd-alert--flex-direction">
                            <strong>{gettext('This will mark as rescheduled the following planning items')}</strong>
                            <RelatedPlannings
                                plannings={original._plannings}
                                openPlanningItem={false}
                                short={true}
                            />
                        </div>
                    </div>
                )}

                {this.state.multiDayChanged && (
                    <div className="sd-alert sd-alert--hollow sd-alert--alert sd-alert--flex-direction">
                        <strong>{gettext(
                            'Event will be changed to a multi-day event!'
                        )}</strong>
                        <br />
                        {gettext('from {{from}} to {{to}}', {
                            from: getDateTimeString(
                                this.state.diff.dates.start,
                                dateFormat,
                                timeFormat,
                                ' @ ',
                                true,
                                timeZone
                            ),
                            to: getDateTimeString(
                                this.state.diff.dates.end,
                                dateFormat,
                                timeFormat,
                                ' @ ',
                                true,
                                timeZone
                            ),
                        })}
                    </div>
                )}

                {afterUntil && (
                    <div className="sd-alert sd-alert--hollow sd-alert--orange2 sd-alert--flex-direction">
                        <strong>{gettext(
                            'This Event is scheduled to occur after the end date of its recurring cycle!'
                        )}</strong>
                    </div>
                )}

                {timeUtils.isEventInDifferentTimeZone(original) && eventUtils.isEventInUse(original) && (
                    <div className="sd-alert sd-alert--hollow sd-alert--orange2 sd-alert--flex-direction">
                        <strong>{gettext('This will create the new event in the remote ({{timeZone}}) timezone',
                            {timeZone})}</strong>
                    </div>
                )}

                <Field
                    component={EventScheduleInput}
                    field="dates"
                    item={this.state.diff}
                    diff={this.state.diff}
                    onChange={this.onDatesChange}
                    showRepeat={false}
                    showRepeatToggle={false}
                    showErrors={true}
                    errors={this.state.errors}
                    formProfile={formProfiles.events}
                    popupContainer={this.getPopupContainer}
                    showFirstEventLabel={false}
                    showToBeConfirmed
                    toBeConfirmed={get(this.state.diff, TO_BE_CONFIRMED_FIELD)}
                />

                <Row>
                    <TextAreaInput
                        label={reasonLabel}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                        showErrors={true}
                        errors={this.state.errors}
                        formProfile={this.props.rescheduleProfile || {}}
                        required={get(this.props.rescheduleProfile, 'schema.reason.required', false)}
                    />
                </Row>

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

RescheduleEventComponent.propTypes = {
    original: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,

    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    rescheduleProfile: PropTypes.object,

    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
};


const mapStateToProps = (state) => ({
    formProfiles: selectors.forms.profiles(state),
    rescheduleProfile: selectors.forms.eventRescheduleProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates, onCloseModal) => {
        let newUpdates = cloneDeep(updates);

        if (timeUtils.isEventInDifferentTimeZone(updates)) {
            newUpdates.dates.start = timeUtils.getDateInRemoteTimeZone(
                updates.dates.start,
                updates.dates.tz
            );
            newUpdates.dates.end = timeUtils.getDateInRemoteTimeZone(
                updates.dates.end,
                updates.dates.tz
            );
        }

        const promise = dispatch(
            actions.events.ui.rescheduleEvent(original, newUpdates)
        );

        if (onCloseModal) {
            promise.then(onCloseModal);
        }

        return promise;
    },

    onHide: (event, modalProps) => {
        const promise = event.lock_action === EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.lock_action ?
            dispatch(actions.events.api.unlock(event)) :
            Promise.resolve(event);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },

    onValidate: (item, profile, errors, errorMessages, fieldsToValidate) => dispatch(validateItem({
        profileName: ITEM_TYPE.EVENT,
        diff: item,
        formProfiles: profile,
        errors: errors,
        messages: errorMessages,
        fields: ['dates'],
        fieldsToValidate: fieldsToValidate,
    })),
});

export const RescheduleEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(RescheduleEventComponent);
