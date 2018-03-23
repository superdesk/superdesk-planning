import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext} from '../../../utils';
import {EVENTS} from '../../../constants';
import {EventScheduleSummary} from '../../Events';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import {RelatedPlannings} from '../../';
import '../style.scss';

export class PostponeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {reason: ''};

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    submit() {
        return this.props.onSubmit({
            ...this.props.initialValues,
            reason: this.state.reason,
        });
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    render() {
        const {initialValues, dateFormat, timeFormat, submitting} = this.props;
        let reasonLabel = gettext('Reason for Event postponement:');
        const numPlannings = initialValues._plannings.length;

        return (
            <div className="ItemActionConfirmation">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline}
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
                    schedule={initialValues.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('Planning Items')}
                    value={numPlannings}
                    noPadding={true}
                />

                {numPlannings > 0 && (
                    <div>
                        <div className="sd-alert sd-alert--hollow sd-alert--alert">
                            <strong>{gettext('This will also postpone the following planning items')}</strong>
                            <RelatedPlannings
                                plannings={initialValues._plannings}
                                openPlanningItem={false}
                                short={true} />
                        </div>
                    </div>
                )}

                <Row label={reasonLabel}>
                    <TextAreaInput
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                    />
                </Row>
            </div>
        );
    }
}

PostponeEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    enableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.postponeEvent(event)),
    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action) {
            return dispatch(actions.events.api.unlock(event));
        }
    },
});

export const PostponeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PostponeEventComponent);
