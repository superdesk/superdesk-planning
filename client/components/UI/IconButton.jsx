import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

const IconButton = ({
    onClick,
    tabIndex,
    onKeyDown,
    enterKeyIsClick,
    icon,
    useDefaultClass,
    className,
    label,
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
        <a
            className={classNames(
                {'icn-btn': useDefaultClass},
                className
            )}
            onClick={onClick}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handleKeyDown : onKeyDown}
            {...props}
        >
            <i className={icon} />
            {label}
        </a>
    );
};

IconButton.propTypes = {
    onClick: PropTypes.func,
    tabIndex: PropTypes.number,
    onKeyDown: PropTypes.func,
    enterKeyIsClick: PropTypes.bool,
    icon: PropTypes.string,
    useDefaultClass: PropTypes.bool,
    className: PropTypes.string,
    label: PropTypes.string,
};

IconButton.defaultProps = {
    enterKeyIsClick: false,
    useDefaultClass: true,
};

export default IconButton;
