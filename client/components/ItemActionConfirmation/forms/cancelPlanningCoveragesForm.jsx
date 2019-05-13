import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, isEmpty} from 'lodash';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {formProfile} from '../../../validators';
import {isItemCancelled, gettext} from '../../../utils';
import {PLANNING} from '../../../constants';

import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

export class PlanningCovergeCancelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {reason: '', errors: {}};

        this.onReasonChange = this.onReasonChange.bind(this);
        this.formProfile = get(props, 'original._cancelAllCoverage')
            ? props.cancelCoveragesProfile : props.cancelPlanningProfile;
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        get(this.formProfile, 'schema.reason.required', false) ?
            this.props.disableSaveInModal() : this.props.enableSaveInModal();
    }

    onReasonChange(field, reason) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];

        if (this.formProfile) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.formProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (get(errorMessages, 'length', 0) > 0 ||
                (get(this.formProfile, 'schema.reason.required', false) && isEmpty(reason))) {
                this.props.disableSaveInModal();
            } else {
                this.props.enableSaveInModal();
            }
        }

        this.setState({
            reason,
            errors,
        });
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            {reason: this.state.reason}
        );
    }

    render() {
        const {original, submitting} = this.props;
        const labelText = original._cancelAllCoverage ?
            gettext('Reason for cancelling all coverage:') :
            gettext('Reason for cancelling the planning item:');

        return (
            <div className="MetadataView">
                <Row value={original.slugline} className="strong" />
                <Row>
                    <TextAreaInput
                        label={labelText}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                        showErrors={true}
                        errors={this.state.errors}
                        formProfile={this.formProfile}
                        required={get(this.formProfile, 'schema.reason.required', false)}
                        initialFocus={true}
                    />
                </Row>
            </div>
        );
    }
}

PlanningCovergeCancelComponent.propTypes = {
    onSubmit: PropTypes.func,
    original: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,

    submitting: PropTypes.bool,
    cancelPlanningProfile: PropTypes.object,
    cancelCoveragesProfile: PropTypes.object,
};

const mapStateToProps = (state) => ({
    cancelPlanningProfile: selectors.forms.planningCancelProfile(state),
    cancelCoveragesProfile: selectors.forms.planningCancelAllCoveragesProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates) => {
        let cancelDispatch, reasonPrefix;

        if (original._cancelAllCoverage) {
            cancelDispatch = actions.planning.ui.cancelAllCoverage;
            reasonPrefix = gettext('All coverages cancelled: ');
        } else {
            cancelDispatch = actions.planning.ui.cancelPlanning;
            reasonPrefix = gettext('Planning cancelled: ');
        }

        if (get(updates, 'reason')) {
            updates.reason = reasonPrefix + updates.reason;
        }

        return dispatch(cancelDispatch(original, updates))
            .then((updatedPlan) => {
                if (get(original, 'lock_action') === PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action ||
                    isItemCancelled(updatedPlan)) {
                    return dispatch(actions.planning.api.unlock(updatedPlan));
                }

                return Promise.resolve(updatedPlan);
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
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PlanningCovergeCancelComponent);
