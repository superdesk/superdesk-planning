import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {isItemCancelled, gettext} from '../../../utils';
import {PLANNING} from '../../../constants';
import {get} from 'lodash';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

export class PlanningCovergeCancelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reason: '',
            submitting: false,
        };

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    submit() {
        // Modal closes after submit. So, resetting submitting is not required
        this.setState({submitting: true});

        this.props.onSubmit({
            ...this.props.initialValues,
            reason: this.state.reason,
        });
    }

    render() {
        const {initialValues} = this.props;
        let planning = initialValues;
        const labelText = initialValues._cancelAllCoverage ? gettext('Reason for cancelling all coverage:') :
            gettext('Reason for cancelling the planning item:');

        return (
            <div className="ItemActionConfirmation">
                <Row value={planning.slugline} className="strong" />
                <Row label={labelText}>
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

PlanningCovergeCancelComponent.propTypes = {
    onSubmit: PropTypes.func,
    initialValues: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (plan) => {
        let cancelDispatch = () => (dispatch(actions.planning.ui.cancelPlanning(plan)));

        if (plan._cancelAllCoverage) {
            cancelDispatch = () => (dispatch(actions.planning.ui.cancelAllCoverage(plan)));
        }

        return cancelDispatch()
            .then((plan) => {
                if (get(plan, '_publish', false)) {
                    dispatch(actions.planning.ui.publish(plan));
                }

                if (plan.lock_action === PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action ||
                    isItemCancelled(plan)) {
                    dispatch(actions.planning.api.unlock(plan));
                }
            });
    },

    onHide: (planning) => {
        if (planning.lock_action === PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.lock_action ||
                planning.lock_action === PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action) {
            dispatch(actions.planning.api.unlock(planning));
        }
    },
});

export const CancelPlanningCoveragesForm = connect(
    null,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PlanningCovergeCancelComponent);
