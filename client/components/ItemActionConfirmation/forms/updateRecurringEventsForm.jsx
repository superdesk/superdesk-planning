import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {reduxForm, formValueSelector} from 'redux-form';
import * as actions from '../../../actions';
import {getDateFormat} from '../../../selectors/config';
import moment from 'moment';
import {EventUpdateMethods} from '../../Events';
import '../style.scss';
import {get, isNil} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {FORM_NAMES} from '../../../constants';

const Component = ({handleSubmit, initialValues, relatedEvents = [], dateFormat, submitting}) => {
    let event = initialValues;
    const originalEvent = event._originalEvent;
    let startStr = moment(event.dates.start).format('MMMM Do YYYY, h:mm:ss a');
    let endStr = moment(event.dates.end).format('MMMM Do YYYY, h:mm:ss a');
    let showRecurring = event.recurrence_id;

    const isOriginalRecurring = !isNil(get(originalEvent, 'dates.recurring_rule'));
    const isUpdatedRecurring = !isNil(get(event, 'dates.recurring_rule'));

    // Default the update_method to 'Update this event only'
    event.update_method = EventUpdateMethods[0];

    let updateMethodLabel = 'Would you like to update all recurring events or just this one?';
    let showUpdateMethod = true;

    if (isOriginalRecurring && !isUpdatedRecurring) {
        // A recurring event was converted to a non-recurring one
        // Display a confirmation modal indicating the after-effects
        showRecurring = false;
        showUpdateMethod = false;
        updateMethodLabel = 'Only this instance of the recurrent series will be affected.';
    }

    return (
        <div className="ItemActionConfirmation">
            <div className="metadata-view">
                <dl>
                    { event.slugline && (<dt>Slugline:</dt>) }
                    { event.slugline && (<dd>{ event.slugline }</dd>) }
                    { event.name && (<dt>Name:</dt>) }
                    { event.name && (<dd>{ event.name }</dd>) }
                    <dt>Starts:</dt>
                    <dd>{ startStr }</dd>
                    <dt>Ends:</dt>
                    <dd>{ endStr }</dd>
                    { showRecurring && (<dt>Events:</dt>)}
                    { showRecurring && (<dd>{ relatedEvents.length + 1 }</dd>)}
                </dl>
            </div>

            {!showUpdateMethod && <p>{ updateMethodLabel }</p>}
            <UpdateMethodSelection
                showMethodSelection={showUpdateMethod}
                updateMethodLabel={updateMethodLabel}
                relatedEvents={relatedEvents}
                dateFormat={dateFormat}
                readOnly={submitting}
                handleSubmit={handleSubmit} />
        </div>
    );
};

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string.isRequired,
    submitting: PropTypes.bool,
};

// Decorate the form container
export const UpdateRecurringEvents = reduxForm({form: FORM_NAMES.UpdateRecurringEventsForm})(Component);

const selector = formValueSelector(FORM_NAMES.UpdateRecurringEventsForm);

const mapStateToProps = (state) => ({
    relatedEvents: selector(state, '_events'),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.saveAndPublish(
        event,
        get(event, '_save', true),
        get(event, '_publish', false)
    )),
});

export const UpdateRecurringEventsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateRecurringEvents);
