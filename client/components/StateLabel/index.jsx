/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import classNames from 'classnames';
import {Label} from '../../components';
import {getItemWorkflowStateLabel, getItemPostedStateLabel} from '../../utils';

export const StateLabel = ({item, verbose, withPubStatus, className, fieldName, inline}) => {
    const state = getItemWorkflowStateLabel(item, fieldName);
    const pubState = withPubStatus ? getItemPostedStateLabel(item) : null;

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
        <span className={classNames(
            {'sd-list-item__inline-icon': inline},
            className
        )}>
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
    inline: PropTypes.bool,
};

StateLabel.defaultProps = {
    withPubStatus: true,
    fieldName: 'state',
    inline: false,
};
