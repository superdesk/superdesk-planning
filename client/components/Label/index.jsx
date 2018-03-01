/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {gettext} from '../../utils';
import './style.scss';

export const Label = ({text, iconType, verbose, isHollow, tooltip, onClick}) => {
    const labelClasses = classNames('label',
        `label--${iconType}`,
        {'label--hollow': isHollow},
        {'label--clickable': !!onClick});

    const label = (
        <span className={labelClasses}>
            {verbose ? gettext(verbose) : gettext(text)}
        </span>
    );

    return (
        <span onClick={onClick ? onClick : null}>
            {tooltip &&
                <span
                    data-sd-tooltip={gettext(tooltip.text)}
                    data-flow={tooltip.flow ? tooltip.flow : 'down'}>
                    {label}
                </span>
            }
            {!tooltip && label}
        </span>
    );
};

Label.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
    iconType: PropTypes.string,
    isHollow: PropTypes.bool,
    tooltip: PropTypes.object,
    verbose: PropTypes.string,
    onClick: PropTypes.func,
};

Label.defaultProps = {
    iconType: 'draft',
    isHollow: true,
    tooltip: undefined,
};