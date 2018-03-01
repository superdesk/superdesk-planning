/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {Label} from '../../components';
import {getItemWorkflowStateLabel, getItemPublishedStateLabel} from '../../utils';

export const StateLabel = ({item, verbose, withPubStatus, className, fieldName}) => {
    const state = getItemWorkflowStateLabel(item, fieldName);
    const pubState = withPubStatus ? getItemPublishedStateLabel(item) : null;

    if (!state) {
        return null;
    }

    const getStateLabel = (state) => <Label
        text={state.label}
        iconType={state.iconType}
        verbose={verbose ? get(state, 'labelVerbose') : null}
        tooltip={!verbose && state.tooltip ? {text: state.tooltip} : null}
    />;

    return (
        <span className={className}>
            <div>{getStateLabel(state)}</div>
            <div>{withPubStatus && pubState && getStateLabel(pubState)}</div>
        </span>
    );
};

StateLabel.propTypes = {
    item: PropTypes.object,
    verbose: PropTypes.bool,
    withPubStatus: PropTypes.bool,
    className: PropTypes.string,
    fieldName: PropTypes.string,
};

StateLabel.defaultProps = {
    withPubStatus: true,
    fieldName: 'state',
};
