import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {appConfig} from 'appConfig';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext, updateFormValues, eventUtils, timeUtils} from '../../../utils';
import {Row} from '../../UI/Preview/';
import {RepeatEventSummary} from '../../Events';
import {RecurringRulesInput} from '../../Events/RecurringRulesInput/index';
import '../style.scss';
import {get, cloneDeep, isEqual, set} from 'lodash';
import {EVENTS, ITEM_TYPE, TIME_COMPARISON_GRANULARITY} from '../../../constants';
import {validateItem} from '../../../validators';

export class UpdateEventRepetitionsComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            errors: {},
            diff: {},
        };

        this.onChange = this.onChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);

        this.dom = {popupContainer: null};
    }

    componentWillMount() {
        this.setState({
            diff: cloneDeep(this.props.original),
        });
    }

    onChange(field, value) {
        const {original} = this.props;
        const errors = cloneDeep(this.state.errors);
        const diff = cloneDeep(get(this.state, 'diff') || {});
        const firstEvent = cloneDeep(get(original, '_recurring[0]'));
        let errorMessages = [];

        updateFormValues(diff, field, value);

        // Use the first Event in the series for validation purposes
        // This makes the validation of the 'until' date/time work across the series
        set(firstEvent, 'dates.recurring_rule', get(diff, 'dates.recurring_rule'));
        this.props.onValidate(
            firstEvent,
            this.props.formProfiles,
            errors,
            errorMessages
        );

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.original, diff),
            errors: errors,
        });

        if (!isEqual(errorMessages, []) || eventUtils.eventsDatesSame(
            diff,
            this.props.original,
            TIME_COMPARISON_GRANULARITY.DAY
        )) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            this.state.diff,
            get(this.props, 'modalProps') || {}
        );
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {original, submitting} = this.props;
        const {diff} = this.state;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <Row
                    label={gettext('Series Start Date')}
                    value={get(original, '_recurring[0].dates.start')
                    && original._recurring[0].dates.start.format(appConfig.planning.dateformat) || ''}
                    className="strong"
                    noPadding={true}
                />

                <Row>
                    <RepeatEventSummary schedule={diff.dates || {}} />
                </Row>

                <RecurringRulesInput
                    onlyUpdateRepetitions
                    onChange={this.onChange}
                    schedule={diff.dates || {}}
                    readOnly={submitting}
                    errors={get(this.state.errors, 'dates.recurring_rule')}
                    popupContainer={() => this.dom.popupContainer}
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

UpdateEventRepetitionsComponent.propTypes = {
    original: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    submitting: PropTypes.bool,
    onHide: PropTypes.func,
    modalProps: PropTypes.object,
};

const mapStateToProps = (state) => ({
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates, modalProps) => {
        let newUpdates = cloneDeep(updates);

        if (get(event, 'dates.recurring_rule.until')) {
            newUpdates.dates.recurring_rule.until =
                timeUtils.getDateInRemoteTimeZone(
                    newUpdates.dates.recurring_rule.until,
                    newUpdates.dates.tz
                ).endOf('day');
        }

        const promise = dispatch(
            actions.events.ui.updateRepetitions(original, newUpdates)
        );

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
    onHide: (event, modalProps) => {
        const promise = event.lock_action === EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.lock_action ?
            dispatch(actions.events.api.unlock(event)) :
            Promise.resolve(event);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
    onValidate: (item, profile, errors, errorMessages) => dispatch(validateItem({
        profileName: ITEM_TYPE.EVENT,
        diff: item,
        formProfiles: profile,
        errors: errors,
        messages: errorMessages,
        fields: ['dates'],
    })),
});

export const UpdateEventRepetitionsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(UpdateEventRepetitionsComponent);
