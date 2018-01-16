import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import '../style.scss';
import {get, set, isEqual, cloneDeep} from 'lodash';
import {EventScheduleSummary, EventScheduleInput} from '../../Events';
import {EVENTS} from '../../../constants';
import {getDateFormat, getTimeFormat, getMaxRecurrentEvents} from '../../../selectors/config';
import {Row} from '../../UI/Preview';
import {eventValidators} from '../../../validators';

export class ConvertToRecurringEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            submitting: false,
            errors: null,
        };
    }

    componentWillMount() {
        this.currentDate = cloneDeep(this.props.initialValues.dates);
        let diff = {dates: cloneDeep(this.props.initialValues.dates)};

        diff.dates.recurring_rule = {
            frequency: 'DAILY',
            interval: 1,
            endRepeatMode: 'count',
            count: 1,
        };
        this.setState({diff: diff});
    }

    onChange(field, val) {
        const diff = Object.assign({}, this.state.diff);

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
            this.props.disableSaveInModal();
        } else {
            set(diff, field, val);
        }

        const validtionErrors = eventValidators.validateEventDates(diff.dates,
            this.props.maxRecurrentEvents);

        let newStateErrors = null;

        if (validtionErrors.hasErrors) {
            newStateErrors = validtionErrors.data;
        }

        this.setState({
            diff: diff,
            errors: newStateErrors,
        });

        if (isEqual(diff.dates, this.props.initialValues.dates) ||
            (diff.dates.recurring_rule &&
            !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            validtionErrors.hasErrors) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        const updatedEvent = {
            ...this.props.initialValues,
            ...this.state.diff,
        };

        this.props.onSubmit(updatedEvent);
    }

    render() {
        const {initialValues, dateFormat, timeFormat, maxRecurrentEvents} = this.props;

        return (
            <div className="ItemActionConfirmation">
                {initialValues.slugline && (
                    <Row
                        label={gettext('Slugline')}
                        value={initialValues.slugline || ''}
                        noPadding={true}
                        className="slugline"
                    />
                )}

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={this.currentDate}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
                />

                <EventScheduleInput
                    item={this.state.diff}
                    diff={this.state.diff}
                    onChange={this.onChange.bind(this)}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    maxRecurrentEvents={maxRecurrentEvents}
                    showRepeatToggle={false} />
            </div>
        );
    }
}

ConvertToRecurringEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    maxRecurrentEvents: PropTypes.number.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    maxRecurrentEvents: getMaxRecurrentEvents(state),
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
        if (event.lock_action === EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },
});

export const ConvertToRecurringEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(ConvertToRecurringEventComponent);
