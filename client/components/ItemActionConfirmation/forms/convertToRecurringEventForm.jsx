import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as actions from '../../../actions';
import '../style.scss';
import {get, isEqual, cloneDeep} from 'lodash';
import {EventScheduleSummary, EventScheduleInput} from '../../Events';
import {EVENTS, ITEM_TYPE, TIME_COMPARISON_GRANULARITY} from '../../../constants';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import {Row} from '../../UI/Preview';
import {Field} from '../../UI/Form';
import {validateItem} from '../../../validators';
import {updateFormValues, eventUtils, timeUtils, gettext} from '../../../utils';

export class ConvertToRecurringEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            errors: {},
        };

        this.onChange = this.onChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);

        this.dom = {popupContainer: null};
    }

    componentWillMount() {
        this.currentDate = cloneDeep(this.props.initialValues.dates);
        let diff = {dates: cloneDeep(this.props.initialValues.dates)};

        diff.dates.recurring_rule = {
            frequency: 'DAILY',
            interval: 1,
            endRepeatMode: 'until',
            until: null,
        };
        this.validateAndSetState(diff);
    }

    onChange(field, val) {
        const diff = cloneDeep(get(this.state, 'diff') || {});

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
            this.props.disableSaveInModal();
        } else {
            updateFormValues(diff, field, val);
        }

        const errorsMessages = this.validateAndSetState(diff);

        if (eventUtils.eventsDatesSame(diff, this.props.initialValues, TIME_COMPARISON_GRANULARITY.MINUTE) ||
            (!diff.dates.recurring_rule) ||
            !isEqual(errorsMessages, [])
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    validateAndSetState(diff) {
        let errors = cloneDeep(this.state.errors);
        let errorsMessages = [];


        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors,
            errorsMessages
        );

        this.setState({
            diff: diff,
            errors: errors,
        });

        return errorsMessages;
    }

    submit() {
        return this.props.onSubmit({
            ...this.props.initialValues,
            ...this.state.diff,
        });
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        const timeZone = get(initialValues, 'dates.tz');

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
                    noPadding={true}
                    className="slugline"
                />

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

                {timeUtils.isEventInDifferentTimeZone(initialValues) &&
                    <div className="sd-alert sd-alert--hollow sd-alert--orange2 sd-alert--flex-direction">
                        <strong>{gettext('This will create new events in the remote ({{timeZone}}) timezone',
                            {timeZone})}</strong>
                    </div>}

                <Field
                    component={EventScheduleInput}
                    field="dates"
                    item={this.state.diff}
                    diff={this.state.diff}
                    onChange={this.onChange}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    showRepeatToggle={false}
                    showErrors={true}
                    errors={this.state.errors}
                    popupContainer={this.getPopupContainer}
                    showRemoteTimeZone
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

ConvertToRecurringEventComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,

    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => {
        if (timeUtils.isEventInDifferentTimeZone(event)) {
            let newEvent = cloneDeep(event);

            newEvent.dates.start = timeUtils.getDateInRemoteTimeZone(event.dates.start, event.dates.tz);
            newEvent.dates.end = timeUtils.getDateInRemoteTimeZone(event.dates.end, event.dates.tz);

            return dispatch(actions.main.save(newEvent, false));
        }
    },

    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },

    onValidate: (item, profile, errors, errorsMessages) => dispatch(validateItem({
        profileName: ITEM_TYPE.EVENT,
        diff: item,
        formProfiles: profile,
        errors: errors,
        messages: errorsMessages,
        fields: ['dates'],
    })),
});

export const ConvertToRecurringEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(ConvertToRecurringEventComponent);
