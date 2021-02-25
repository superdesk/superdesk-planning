import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, isEmpty} from 'lodash';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext} from '../../../utils';
import {EVENTS} from '../../../constants';

import {EventScheduleSummary} from '../../Events';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import {RelatedPlannings} from '../../';

import '../style.scss';
import {formProfile} from '../../../validators';


export class PostponeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reason: '',
            errors: {},
        };

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        get(this.props, 'formProfile.schema.reason.required', false) ?
            this.props.disableSaveInModal() : this.props.enableSaveInModal();
    }

    submit() {
        const reason = this.state.reason ? (gettext('Event Postponed: ') + this.state.reason) :
            this.state.reason;

        return this.props.onSubmit(
            this.props.original,
            {reason: reason},
            get(this.props, 'modalProps.onCloseModal')
        );
    }

    onReasonChange(field, reason) {
        const errors = cloneDeep(this.state.errors);
        let errorMessages = [];

        if (this.props.formProfile) {
            formProfile(
                {
                    field: field,
                    value: reason,
                    profile: this.props.formProfile,
                    errors: errors,
                    messages: errorMessages,
                }
            );

            if (get(errorMessages, 'length', 0) > 0 ||
                (get(this.props.formProfile, 'schema.reason.required', false) && isEmpty(reason))) {
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

    render() {
        const {original, submitting} = this.props;
        let reasonLabel = gettext('Reason for Event postponement:');
        const numPlannings = original._plannings.length;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={original.dates}
                    noPadding={true}
                    forUpdating={true}
                    useEventTimezone={true}
                />

                <Row
                    enabled={!!numPlannings}
                    label={gettext('Planning Items')}
                    value={numPlannings}
                    noPadding={true}
                />

                {numPlannings > 0 && (
                    <div className="sd-alert sd-alert--hollow sd-alert--alert sd-alert--flex-direction">
                        <strong>{gettext('This will also postpone the following planning items')}</strong>
                        <RelatedPlannings
                            plannings={original._plannings}
                            openPlanningItem={false}
                            short={true}
                        />
                    </div>
                )}

                <Row>
                    <TextAreaInput
                        label={reasonLabel}
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                        showErrors={true}
                        errors={this.state.errors}
                        formProfile={this.props.formProfile}
                        required={get(this.props.formProfile, 'schema.reason.required', false)}
                        initialFocus={true}
                    />
                </Row>
            </div>
        );
    }
}

PostponeEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    original: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,

    onValidate: PropTypes.func,
    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
    formProfile: PropTypes.object,
};

const mapStateToProps = (state) => ({
    formProfile: selectors.forms.eventPostponeProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (original, updates, onCloseModal) => {
        const promise = dispatch(
            actions.events.ui.postponeEvent(original, updates)
        );

        if (onCloseModal) {
            promise.then(onCloseModal);
        }

        return promise;
    },

    onHide: (event, modalProps) => {
        const promise = event.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action ?
            dispatch(actions.events.api.unlock(event)) :
            Promise.resolve(event);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
});

export const PostponeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(PostponeEventComponent);
