import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import '../style.scss';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import {gettext, getDateTimeString} from '../../../utils';
import {Row} from '../../UI/Preview';

export class UnspikePlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        // Initialise with enable save so that the user can action on this plan.
        props.enableSaveInModal();
    }

    submit() {
        return this.props.onSubmit(this.props.original);
    }

    render() {
        const {original, dateFormat, timeFormat} = this.props;

        return (
            <div className="MetadataView">
                <Row
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    className="slugline"
                    noPadding={true} />

                <Row
                    enabled={!!original.name}
                    label={gettext('Name')}
                    value={original.name || ''}
                    className="strong"
                    noPadding={true} />

                <Row
                    label={gettext('Planning Date')}
                    value={getDateTimeString(original.planning_date, dateFormat, timeFormat) || ''}
                    noPadding={true} />
            </div>
        );
    }
}

UnspikePlanningComponent.propTypes = {
    original: PropTypes.object.isRequired,
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
    onSubmit: (plan) => dispatch(actions.planning.ui.unspike(plan)),
});

export const UnspikePlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(UnspikePlanningComponent);
