import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {appConfig} from 'appConfig';

import * as actions from '../../../actions';
import '../style.scss';
import {gettext, getDateTimeString} from '../../../utils';
import {Row} from '../../UI/Preview';

export class SpikePlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        // Initialise with enable save so that the user can action on this plan.
        props.enableSaveInModal();
    }


    submit() {
        return this.props.onSubmit(this.props.original);
    }

    render() {
        const {original} = this.props;

        return (
            <div className="MetadataView">
                <Row
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    enabled={!!original.name}
                    label={gettext('Name')}
                    value={original.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <Row
                    label={gettext('Planning Date')}
                    value={getDateTimeString(
                        original.planning_date,
                        appConfig.planning.dateformat,
                        appConfig.planning.timeformat
                    ) || ''}
                    noPadding={true}
                />
            </div>
        );
    }
}

SpikePlanningComponent.propTypes = {
    original: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
};

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
    null,
    mapDispatchToProps,
    null,
    {forwardRef: true})(SpikePlanningComponent);
