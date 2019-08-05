import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, isEmpty} from 'lodash';

import * as selectors from '../../../selectors';
import {formProfile} from '../../../validators';
import {gettext} from '../../../utils';
import {PLANNING, WORKFLOW_STATE} from '../../../constants';

import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import '../style.scss';

export class CancelCoverageComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {reason: '', errors: {}};

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        get(this.props.coverageCancelProfile, 'schema.reason.required', false) ?
            this.props.disableSaveInModal() : this.props.enableSaveInModal();
    }

    onReasonChange(field, reason) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];

        if (this.props.coverageCancelProfile) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.props.coverageCancelProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (get(errorMessages, 'length', 0) > 0 ||
                (get(this.props.coverageCancelProfile, 'schema.reason.required', false) && isEmpty(reason))) {
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
        let coverage = cloneDeep(this.props.modalProps.coverage);

        coverage.news_coverage_status = PLANNING.NEWS_COVERAGE_CANCELLED_STATUS;
        coverage.planning.workflow_status_reason = this.state.reason;
        coverage.workflow_status = WORKFLOW_STATE.CANCELLED;

        if (get(coverage, 'assigned_to.state')) {
            coverage.assigned_to.state = WORKFLOW_STATE.CANCELLED;
        }

        return this.props.onSubmit(this.props.original, coverage, this.props.modalProps.index);
    }

    render() {
        return (
            <div className="MetadataView">
                <Row value={get(this.props, 'modalProps.coverage.planning.slugline')} className="strong" />
                <Row>
                    <TextAreaInput
                        label={gettext('Reason for cancelling the coverage')}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={this.props.submitting}
                        showErrors={true}
                        errors={this.state.errors}
                        formProfile={this.props.coverageCancelProfile}
                        required={get(this.props.coverageCancelProfile, 'schema.reason.required', false)}
                        initialFocus={true}
                    />
                </Row>
            </div>
        );
    }
}

CancelCoverageComponent.propTypes = {
    onSubmit: PropTypes.func,
    original: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,

    submitting: PropTypes.bool,
    coverageCancelProfile: PropTypes.object,
    modalProps: PropTypes.shape({
        coverage: PropTypes.object.isRequired,
        index: PropTypes.number.isRequired,
        onSubmit: PropTypes.func.isRequired,
        onCancel: PropTypes.func.isRequired,
    }),
};

const mapStateToProps = (state) => ({coverageCancelProfile: selectors.forms.coverageCancelProfile(state)});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (original, updates, index) => ownProps.modalProps.onSubmit(original, updates, index),

    onHide: () => {
        ownProps.modalProps.onCancel();
    },
});

export const CancelCoverageForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(CancelCoverageComponent);

