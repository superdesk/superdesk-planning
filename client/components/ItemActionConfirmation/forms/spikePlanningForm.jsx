import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import * as actions from '../../../actions';
import '../style.scss';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {gettext, getDateTimeString} from '../../../utils';
import {Row} from '../../UI/Preview';

export class SpikePlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        // Initialise with enable save so that the user can action on this plan.
        props.enableSaveInModal();
    }


    submit() {
        return this.props.onSubmit({
            ...this.props.initialValues,
        });
    }

    render() {
        const {initialValues, dateFormat, timeFormat} = this.props;

        return (
            <div className="MetadataView">
                <Row
                    label={gettext('Slugline')}
                    value={initialValues.slugline || ''}
                    className="slugline"
                    noPadding={true} />

                <Row
                    enabled={!!initialValues.name}
                    label={gettext('Name')}
                    value={initialValues.name || ''}
                    className="strong"
                    noPadding={true} />

                <Row
                    label={gettext('Planning Date')}
                    value={getDateTimeString(initialValues.planning_date, dateFormat, timeFormat) || ''}
                    noPadding={true} />
            </div>
        );
    }
}

SpikePlanningComponent.propTypes = {
    initialValues: PropTypes.object.isRequired,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};


const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (plan) => dispatch(actions.planning.ui.spike(plan)),
    onHide: (plan, modalProps) => {
        if (get(modalProps, 'onCloseModal')) {
            modalProps.onCloseModal(plan);
        }
        return Promise.resolve(plan);
    },
});

export const SpikePlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(SpikePlanningComponent);
