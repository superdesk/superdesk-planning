import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {validateItem} from '../../../validators';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import '../style.scss';
import {gettext} from '../../../utils';
import {EventScheduleSummary, EventScheduleInput} from '../../Events';
import {RelatedPlannings} from '../../';
import {Row} from '../../UI/Preview';
import {TextAreaInput, Field} from '../../UI/Form';
import {set, isEqual, cloneDeep} from 'lodash';

export class RescheduleEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            reason: '',
            submitting: false,
            errors: {},
        };

        this.onReasonChange = this.onReasonChange.bind(this);
        this.onDatesChange = this.onDatesChange.bind(this);
    }

    componentWillMount() {
        this.setState({diff: {dates: cloneDeep(this.props.initialValues.dates)}});
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    onDatesChange(field, val) {
        const diff = Object.assign({}, this.state.diff);

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
        } else {
            set(diff, field, val);
        }

        const errors = cloneDeep(this.state.errors);

        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors
        );

        this.setState({
            diff: diff,
            errors: errors,
        });

        if (isEqual(diff.dates, this.props.initialValues.dates) ||
            (diff.dates.recurring_rule &&
            !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            !isEqual(errors, {})
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
        this.setState({submitting: true});

        let updatedEvent = {
            ...this.props.initialValues,
            ...this.state.diff,
            reason: this.state.reason,
        };

        this.props.onSubmit(updatedEvent);
    }


    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;
        let reasonLabel = gettext('Reason for rescheduling this event:');
        const numPlannings = initialValues._plannings.length;

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
                    schedule={this.props.initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('No. of Plannings')}
                    value={numPlannings}
                    noPadding={true}
                />

                {numPlannings > 0 && (
                    <div>
                        <div className="sd-alert sd-alert--hollow sd-alert--alert">
                            <strong>{gettext('This will mark as rescheduled the following planning items')}</strong>
                            <RelatedPlannings
                                plannings={initialValues._plannings}
                                openPlanningItem={false}
                                short={true} />
                        </div>
                    </div>
                )}

                <Field
                    component={EventScheduleInput}
                    field="dates"
                    item={this.state.diff}
                    diff={this.state.diff}
                    onChange={this.onDatesChange}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    showRepeat={false}
                    showRepeatToggle={false}
                    showErrors={true}
                    errors={this.state.errors}
                />

                <Row label={reasonLabel}>
                    <TextAreaInput
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={this.state.submitting}
                    />
                </Row>
            </div>
        );
    }
}

RescheduleEventComponent.propTypes = {
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
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.rescheduleEvent(event)),
    onHide: (event) => dispatch(actions.events.api.unlock(event)),

    onValidate: (item, profile, errors) => dispatch(validateItem('events', item, profile, errors, ['dates']))
});

export const RescheduleEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(RescheduleEventComponent);
