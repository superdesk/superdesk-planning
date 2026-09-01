import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture} from './utils';

import {Icon} from './';

/**
 * @ngdoc react
 * @name IconButton
 * @description Icon with Button component
 */
const IconButton = ({
    onClick,
    tabIndex,
    onKeyDown,
    onFocus,
    enterKeyIsClick,
    icon,
    useDefaultClass,
    className,
    label,
    tooltip,
    tooltipDirection,
    testId,
    refNode,
    ...props
}) => {
    const handleKeyDown = (event) => {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            onClick();
            return;
        }

        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    return (
        <button
            className={classNames(
                {'icn-btn': useDefaultClass},
                className
            )}
            onClick={onClick}
            onFocus={onFocus}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handleKeyDown : onKeyDown}
            data-sd-tooltip={tooltip}
            data-flow={tooltipDirection}
            data-test-id={testId}
            {...props}
            ref={refNode}
        >
            <Icon icon={icon} />
            {label}
        </button>
    );
};

IconButton.propTypes = {
    onClick: PropTypes.func,
    tabIndex: PropTypes.number,
    onKeyDown: PropTypes.func,
    onFocus: PropTypes.func,
    enterKeyIsClick: PropTypes.bool,
    icon: PropTypes.string,
    useDefaultClass: PropTypes.bool,
    className: PropTypes.string,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    tooltipDirection: PropTypes.string,
    testId: PropTypes.string,
    // A React ref: either a callback ref (function) or a ref object
    refNode: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

IconButton.defaultProps = {
    enterKeyIsClick: false,
    useDefaultClass: true,
    tooltipDirection: 'down',
};

export default IconButton;
