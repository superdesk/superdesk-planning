import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {reduxForm, formValueSelector} from 'redux-form';
import * as actions from '../../../actions';
import '../style.scss';
import {get} from 'lodash';
import {
    ChainValidators,
    EndDateAfterStartDate,
    RequiredFieldsValidatorFactory,
    UntilDateValidator,
    EventMaxEndRepeatCount} from '../../../validators';
import {EventScheduleForm} from '../../index';
import {EventScheduleSummary} from '../../Events';
import moment from 'moment';
import {FORM_NAMES, EVENTS} from '../../../constants';

export class Component extends React.Component {
    componentWillMount() {
        this.props.change('dates.recurring_rule',
            {
                frequency: 'DAILY',
                interval: 1,
                count: 5,
            });
    }

    onFromTimeChange(value) {
        this.props.change('dates.start', value);
    }

    onToTimeChange(value) {
        this.props.change('dates.end', value);
    }

    render() {
        const {handleSubmit, initialValues, currentSchedule, change, submitting} = this.props;

        let event = initialValues;

        event.dates.start = moment(event.dates.start);
        event.dates.end = moment(event.dates.end);

        return (
            <div className="EventActionConfirmation">
                <form onSubmit={handleSubmit}>
                    <div className="metadata-view">
                        <dl>
                            { event.slugline && (<dt>Slugline:</dt>) }
                            { event.slugline && (<dd>{ event.slugline }</dd>) }
                            { event.name && (<dt>Name:</dt>) }
                            { event.name && (<dd>{ event.name }</dd>) }
                        </dl>
                    </div>

                    <EventScheduleSummary schedule={currentSchedule}/>

                    <EventScheduleForm
                        readOnly={submitting}
                        currentSchedule={currentSchedule}
                        initialSchedule={event.dates}
                        change={change}
                        showRepeat={true}
                        showRepeatToggle={false} />

                </form>
            </div>
        );
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    change: PropTypes.func,
    currentSchedule: PropTypes.object,
    submitting: PropTypes.bool,
};

// Decorate the form container
export const UpdateTime = reduxForm({
    form: FORM_NAMES.ConvertEventToRecurringForm,
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['dates.start', 'dates.end']),
        UntilDateValidator,
        EventMaxEndRepeatCount,
    ]),
    enableReinitialize: true, // the form will reinitialize every time the initialValues prop changes
})(Component);

const selector = formValueSelector(FORM_NAMES.ConvertEventToRecurringForm);

const mapStateToProps = (state) => ({
    relatedEvents: selector(state, '_events'),
    currentSchedule: selector(state, 'dates'),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.saveAndPublish(
        event,
        get(event, '_save', true)
    )).then(() => {
        dispatch({
            type: EVENTS.ACTIONS.UNLOCK_EVENT,
            payload: {event},
        });
    }),

    onHide: (event) => {
        if (event.lock_action === 'convert_recurring') {
            dispatch(actions.events.api.unlock(event));
        }
    },
});

export const ConvertToRecurringEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateTime);
