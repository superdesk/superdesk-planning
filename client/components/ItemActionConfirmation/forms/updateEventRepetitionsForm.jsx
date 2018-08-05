import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {getDateFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import {gettext, updateFormValues} from '../../../utils';
import {Row} from '../../UI/Preview/';
import {RepeatEventSummary} from '../../Events';
import {RecurringRulesInput} from '../../Events/RecurringRulesInput/index';
import '../style.scss';
import {get, cloneDeep, isEqual} from 'lodash';
import {EVENTS, ITEM_TYPE} from '../../../constants';
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
            diff: cloneDeep(this.props.initialValues),
        });
    }

    onChange(field, value) {
        const errors = cloneDeep(this.state.errors);
        const diff = cloneDeep(get(this.state, 'diff') || {});

        updateFormValues(diff, field, value);

        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors
        );

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.initialValues, diff),
            errors: errors,
        });

        if (isEqual(diff.dates, this.props.initialValues.dates) || !isEqual(errors, {})) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(this.state.diff);
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {initialValues, dateFormat, submitting} = this.props;
        const {diff} = this.state;

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!initialValues.slugline}
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <Row
                    label={gettext('Series Start Date')}
                    value={initialValues._recurring[0].dates.start.format(dateFormat) || ''}
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
                    dateFormat={dateFormat}
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
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    submitting: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    dateFormat: getDateFormat(state),
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => dispatch(actions.events.ui.updateRepetitions(event)),
    onHide: (event) => {
        if (event.lock_action === EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.lock_action) {
            dispatch(actions.events.api.unlock(event));
        }
    },
    onValidate: (item, profile, errors) => dispatch(validateItem({
        profileName: ITEM_TYPE.EVENT,
        diff: item,
        formProfiles: profile,
        errors: errors,
        fields: ['dates'],
    })),
});

export const UpdateEventRepetitionsForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateEventRepetitionsComponent);
