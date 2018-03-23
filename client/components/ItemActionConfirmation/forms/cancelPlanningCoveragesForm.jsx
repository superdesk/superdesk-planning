import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as actions from '../../../actions';
import {isItemCancelled, gettext} from '../../../utils';
import {PLANNING} from '../../../constants';

import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

export class PlanningCovergeCancelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {reason: ''};

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
        return this.props.onSubmit({
            ...this.props.initialValues,
            reason: this.state.reason,
        });
    }

    render() {
        const {initialValues, submitting} = this.props;
        let planning = initialValues;
        const labelText = initialValues._cancelAllCoverage ? gettext('Reason for cancelling all coverage:') :
            gettext('Reason for cancelling the planning item:');

        return (
            <div className="MetadataView">
                <Row value={planning.slugline} className="strong" />
                <Row label={labelText}>
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

PlanningCovergeCancelComponent.propTypes = {
    onSubmit: PropTypes.func,
    initialValues: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    enableSaveInModal: PropTypes.func,

    submitting: PropTypes.bool,
};

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (plan) => {
        let cancelDispatch = plan._cancelAllCoverage ?
            actions.planning.ui.cancelAllCoverage :
            actions.planning.ui.cancelPlanning;

        return dispatch(cancelDispatch(plan))
            .then((plan) => {
                if (get(plan, 'lock_action') === PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action ||
                    isItemCancelled(plan)) {
                    return dispatch(actions.planning.api.unlock(plan));
                }

                return Promise.resolve(plan);
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
