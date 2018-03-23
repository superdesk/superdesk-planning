import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import {eventUtils, gettext} from '../../../utils';
import {Label, TimeInput, Row as FormRow, LineInput, Field} from '../../UI/Form/';
import {Row} from '../../UI/Preview/';
import {EventUpdateMethods, EventScheduleSummary} from '../../Events';
import '../style.scss';
import {get, set, cloneDeep, isEqual} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EVENTS} from '../../../constants';
import {validateItem} from '../../../validators';

export class UpdateTimeComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            relatedEvents: [],
            errors: {},
            diff: {},
        };

        this.onChange = this.onChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);

        this.dom = {popupContainer: null};
    }

    componentWillMount() {
        const diff = cloneDeep(this.props.initialValues);
        let relatedEvents = [];

        if (get(this.props, 'initialValues.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(this.props.initialValues,
                EventUpdateMethods[0]);

            relatedEvents = event._events;
        }

        diff.update_method = EventUpdateMethods[0];

        this.setState({
            relatedEvents: relatedEvents,
            diff: diff,
        });
    }

    onChange(field, value) {
        const diff = cloneDeep(get(this.state, 'diff') || {});
        const errors = cloneDeep(this.state.errors);
        let relatedEvents = this.state.relatedEvents;

        if (field === 'dates.start.time') {
            diff.dates.start = value;
        } else if (field === 'dates.end.time') {
            diff.dates.end = value;
        } else if (field === 'update_method') {
            const event = eventUtils.getRelatedEventsForRecurringEvent(
                this.props.initialValues,
                value
            );

            relatedEvents = event._events;
            diff.update_method = value;
        } else {
            set(diff, field, value);
        }

        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors
        );

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.initialValues, diff),
            errors: errors,
            relatedEvents: relatedEvents,
        });

        if ((isEqual(diff.dates, this.props.initialValues.dates) &&
                diff.update_method.value === EventUpdateMethods[0].value) ||
            !isEqual(errors, {})
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(this.state.diff);
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {initialValues, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!initialValues.recurrence_id;
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        const fieldProps = {
            row: false,
            item: this.props.initialValues,
            diff: this.state.diff,
            onChange: this.onChange,
            showErrors: true,
            errors: this.state.errors,
            readOnly: submitting
        };

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <EventScheduleSummary
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
                />

                <Row
                    enabled={isRecurring}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <FormRow
                    flex={true}
                    halfWidth={true}
                    noPadding={true}
                    invalid={!!get(this.state, 'errors.dates.start.time')}
                >
                    <Label text={gettext('From')} row={true}/>
                    <Field
                        component={TimeInput}
                        field="dates.start.time"
                        value={get(this.state, 'diff.dates.start')}
                        timeFormat={timeFormat}
                        noMargin={true}
                        popupContainer={this.getPopupContainer}
                        {...fieldProps}
                    />
                </FormRow>

                <FormRow flex={true} halfWidth={true}>
                    <Label
                        text={gettext('To')}
                        row={true}
                        invalid={!!get(this.state, 'errors.dates.end.time')}
                    />
                    <Field
                        component={TimeInput}
                        field="dates.end.time"
                        value={get(this.state, 'diff.dates.end')}
                        timeFormat={timeFormat}
                        noMargin={true}
                        popupContainer={this.getPopupContainer}
                        {...fieldProps}
                    />
                </FormRow>

                {this.state.error && <FormRow>
                    <LineInput invalid={this.state.error}
                        message="To date should be greater than From date"
                        readOnly={true} />
                </FormRow>}

                <Field
                    component={UpdateMethodSelection}
                    field="update_method"
                    showMethodSelection={isRecurring}
                    updateMethodLabel={gettext('Update all recurring events or just this one?')}
                    showSpace={false}
                    action="update time"
                    {...fieldProps}
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

UpdateTimeComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    submitting: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => dispatch(actions.events.ui.updateEventTime(event)),
    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.UPDATE_TIME.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },
    onValidate: (item, profile, errors) => dispatch(validateItem('event', item, profile, errors, ['dates']))
});

export const UpdateTimeForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateTimeComponent);
