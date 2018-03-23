import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

const Button = ({
    className,
    onClick,
    icon,
    title,
    text,
    disabled,
    textOnly,
    hollow,
    expanded,
    color,
    size,
    iconOnly,
    tabIndex,
    enterKeyIsClick,
    autoFocus,
    refNode,
    onKeyDown,
}) => {
    const handeKeyDown = (event) => {
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
                'btn',
                color ? `btn--${color}` : null,
                size ? `btn--${size}` : null,
                {
                    'btn--disabled': disabled,
                    'btn--text-only': textOnly,
                    'btn--hollow': hollow,
                    'btn--expanded': expanded,
                    'btn--icon-only': iconOnly
                },
                className
            )}
            onClick={disabled ? null : onClick || null}
            title={title || text}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handeKeyDown : onKeyDown}
            autoFocus={autoFocus}
            ref={refNode}
        >
            {icon && <i className={icon} />}
            {!iconOnly && text}
        </button>
    );
};

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.string,
    title: PropTypes.string,
    text: PropTypes.string,
    disabled: PropTypes.bool,
    textOnly: PropTypes.bool,
    hollow: PropTypes.bool,
    iconOnly: PropTypes.bool,
    expanded: PropTypes.bool,
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'alert', 'highlight', 'sd-green']),
    size: PropTypes.oneOf(['small', 'large']),
    tabIndex: PropTypes.number,
    enterKeyIsClick: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onKeyDown: PropTypes.func,
    refNode: PropTypes.func,
};

Button.defaultProps = {
    disabled: false,
    textOnly: false,
    hollow: false,
    iconOnly: false,
    expanded: false,
    enterKeyIsClick: false,
    autoFocus: false,
};

export default Button;
