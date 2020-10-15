/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import classNames from 'classnames';
import {Label} from '../../components';
import {
    getItemWorkflowStateLabel,
    getItemPostedStateLabel,
    getItemExpiredStateLabel,
    eventUtils,
    isEvent,
} from '../../utils';
import {gettext} from '../../utils/gettext';

export const StateLabel = ({
    id,
    item,
    verbose,
    withPubStatus,
    className,
    fieldName,
    inline,
    withExpiredStatus,
    noState,
}) => {
    const state = getItemWorkflowStateLabel(item, fieldName);
    const pubState = withPubStatus ? getItemPostedStateLabel(item) : null;
    const expiredState = withExpiredStatus ? getItemExpiredStateLabel(item) : null;

    if (!state && !noState) {
        return null;
    }

    const getStateLabel = (state) => (
        <Label
            id={id}
            text={gettext(state.label)}
            iconType={state.iconType}
            verbose={verbose ? gettext(get(state, 'labelVerbose')) : null}
            tooltip={!verbose && state.tooltip ? {text: gettext(state.tooltip)} : null}
        />
    );

    return (
        <span
            className={classNames(
                {'sd-list-item__inline-icon': inline},
                className
            )}
        >
            {!noState && <div>{getStateLabel(state)}</div>}
            <div>{withPubStatus && pubState && getStateLabel(pubState)}</div>
            {expiredState && (
                <div>
                    {getStateLabel(expiredState)}
                </div>
            )}
            {isEvent(item) && eventUtils.isEventCompleted(item) && (
                <Label
                    text={gettext('Event Completed')}
                    iconType="success"
                    isHollow={true}
                />
            )}
        </span>
    );
};

StateLabel.propTypes = {
    id: PropTypes.string,
    item: PropTypes.object,
    verbose: PropTypes.bool,
    withPubStatus: PropTypes.bool,
    className: PropTypes.string,
    fieldName: PropTypes.string,
    inline: PropTypes.bool,
    withExpiredStatus: PropTypes.bool,
    noState: PropTypes.bool,
};

StateLabel.defaultProps = {
    withPubStatus: true,
    fieldName: 'state',
    inline: false,
    withExpiredStatus: false,
};
