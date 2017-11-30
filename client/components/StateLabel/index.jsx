/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {Label} from '../../components';
import {getItemWorkflowStateLabel, getItemPublishedStateLabel} from '../../utils';

export const StateLabel = ({item, verbose, withPubStatus}) => {
    const state = getItemWorkflowStateLabel(item);
    const pubState = withPubStatus ? getItemPublishedStateLabel(item) : null;

    if (!state) {
        return null;
    }

    const getStateLabel = (state) => <Label
        text={state.label}
        iconType={state.iconType}
        verbose={verbose ? get(state, 'labelVerbose') : null}
        tooltip={state.tooltip ? {text: state.tooltip} : null}
    />;

    return (
        <span>
            {getStateLabel(state)}
            &nbsp;&nbsp;
            {withPubStatus && pubState && getStateLabel(pubState)}
        </span>
    );
};

StateLabel.propTypes = {
    item: PropTypes.object,
    verbose: PropTypes.bool,
    withPubStatus: PropTypes.bool,
};

StateLabel.defaultProps = {withPubStatus: true};
