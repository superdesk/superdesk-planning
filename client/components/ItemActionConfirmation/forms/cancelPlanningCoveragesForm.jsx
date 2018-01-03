import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {InputTextAreaField} from '../../fields/index';
import {isItemCancelled, gettext} from '../../../utils';
import {get} from 'lodash';
import {Row} from '../../UI/Preview';
import '../style.scss';

export class PlanningCovergeCancelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reason: '',
            submitting: false,
        };
    }

    onReasonChange(event) {
        this.setState({reason: get(event, 'target.value')});
    }

    submit() {
        // Modal closes after submit. So, reseting submitting is not required
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
        const reasonInputProp = {onChange: this.onReasonChange.bind(this)};

        return (
            <div className="ItemActionConfirmation">
                <Row value={planning.slugline} className="strong" />
                <Row label={labelText}>
                    <InputTextAreaField
                        type="text"
                        readOnly={this.state.submitting}
                        input={reasonInputProp} />
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

                if (plan.lock_action === 'cancel_all_coverage' ||
                    isItemCancelled(plan)) {
                    dispatch(actions.planning.api.unlock(plan));
                }
            });
    },

    onHide: (planning) => {
        if (planning.lock_action === 'planning_cancel' ||
                planning.lock_action === 'cancel_all_coverage') {
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
