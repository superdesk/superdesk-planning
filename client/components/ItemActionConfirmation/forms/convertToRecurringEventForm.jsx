import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import '../style.scss';
import {get, isEqual, cloneDeep} from 'lodash';
import {EventScheduleSummary, EventScheduleInput} from '../../Events';
import {EVENTS} from '../../../constants';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import {Row} from '../../UI/Preview';
import {Field} from '../../UI/Form';
import {validateItem} from '../../../validators';
import {updateFormValues} from '../../../utils';

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
            endRepeatMode: 'count',
            count: 1,
        };
        this.setState({diff: diff});
    }

    onChange(field, val) {
        const diff = cloneDeep(get(this.state, 'diff') || {});

        if (field === 'dates.recurring_rule' && !val) {
            delete diff.dates.recurring_rule;
            this.props.disableSaveInModal();
        } else {
            updateFormValues(diff, field, val);
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

        if (
            isEqual(diff.dates, this.props.initialValues.dates) ||
            (!diff.dates.recurring_rule && !diff.dates.recurring_rule.until && !diff.dates.recurring_rule.count) ||
            !isEqual(errors, {})
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
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
    onSubmit: (event) => dispatch(actions.main.save(event, false)),

    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },

    onValidate: (item, profile, errors) => dispatch(validateItem('event', item, profile, errors, ['dates']))
});

export const ConvertToRecurringEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(ConvertToRecurringEventComponent);
