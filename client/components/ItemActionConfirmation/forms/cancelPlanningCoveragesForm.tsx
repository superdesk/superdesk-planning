import React from 'react';
import {connect} from 'react-redux';
import {get, cloneDeep, isEmpty} from 'lodash';

import {IPlanningItem, IPlanningProfile} from '../../../interfaces';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {formProfile} from '../../../validators';
import {isItemCancelled, gettext} from '../../../utils';
import {PLANNING} from '../../../constants';

import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

interface IProps {
    original: IPlanningItem;
    submitting: boolean;
    cancelPlanningProfile: IPlanningProfile;
    cancelCoveragesProfile: IPlanningProfile;

    enableSaveInModal: () => void;
    disableSaveInModal: () => void;
    onSubmit: (original: IPlanningItem, updates: {reason: string}) => Promise<IPlanningItem>;
    onHide: (planning: IPlanningItem) => void;
}

interface IState {
    reason: string;
    errors: {[key: string]: string};
}

export class PlanningCoverageCancelComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            reason: '',
            errors: {},
        };

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    get formProfile(): IPlanningProfile {
        return this.props.original?._cancelAllCoverage ?
            this.props.cancelCoveragesProfile :
            this.props.cancelPlanningProfile;
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        this.formProfile?.schema?.reason?.required === true ?
            this.props.disableSaveInModal() :
            this.props.enableSaveInModal();
    }

    onReasonChange(field: string, reason: string) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];

        if (this.formProfile != null) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.formProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (errorMessages.length > 0 || (this.formProfile.schema?.reason?.required === true && isEmpty(reason))) {
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
        const labelText = this.props.original._cancelAllCoverage ?
            gettext('Reason for cancelling all coverage:') :
            gettext('Reason for cancelling the planning item:');

        const error = Object.values(this.state.errors)?.[0] ?? null;

        return (
            <div className="MetadataView">
                <Row value={this.props.original?.slugline ?? this.props.original?.name ?? ''} className="strong" />
                <Row>
                    <TextAreaInput
                        field={'reason'}
                        label={labelText}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        readOnly={this.props.submitting}
                        invalid={error != null}
                        message={error}
                        required={this.formProfile?.schema?.reason?.required === true}
                        initialFocus={true}
                    />
                </Row>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    cancelPlanningProfile: selectors.forms.planningCancelProfile(state),
    cancelCoveragesProfile: selectors.forms.planningCancelAllCoveragesProfile(state),
});

const cancelBasedLocks = [
    PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.lock_action,
    PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.lock_action
];

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original: IPlanningItem, updates: IPlanningItem) => {
        let cancelDispatch, reasonPrefix;

        if (original._cancelAllCoverage) {
            cancelDispatch = actions.planning.ui.cancelAllCoverage;
            reasonPrefix = gettext('All coverages cancelled: ');
        } else {
            cancelDispatch = actions.planning.ui.cancelPlanning;
            reasonPrefix = gettext('Planning cancelled: ');
        }

        if (updates.reason?.length > 0) {
            updates.reason = reasonPrefix + updates.reason;
        }

        return dispatch(cancelDispatch(original, updates))
            .then((updatedPlan: IPlanningItem) => {
                if (cancelBasedLocks.includes(original.lock_action) || isItemCancelled(updatedPlan)) {
                    return dispatch(actions.planning.api.unlock(updatedPlan));
                }

                return Promise.resolve(updatedPlan);
            });
    },

    onHide: (planning: IPlanningItem) => {
        if (cancelBasedLocks.includes(planning.lock_action)) {
            dispatch(actions.planning.api.unlock(planning));
        }
    },
});

export const CancelPlanningCoveragesForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(PlanningCoverageCancelComponent);
