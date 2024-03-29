import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture} from './utils';


/**
 * @ngdoc react
 * @name Button
 * @description Generic Button component
 */
const Button = ({
    className,
    onClick,
    icon,
    id,
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
    iconOnlyCircle,
    children,
    pullRight,
    empty,
    ...props
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
            id={id}
            className={classNames(
                color ? `btn--${color}` : null,
                size ? `btn--${size}` : null,
                {
                    btn: !empty,
                    'btn--disabled': disabled,
                    'btn--text-only': textOnly,
                    'btn--hollow': hollow,
                    'btn--expanded': expanded,
                    'btn--icon-only': iconOnly,
                    'btn--icon-only-circle': iconOnlyCircle,
                    'pull-right': pullRight,
                },
                className
            )}
            onClick={disabled ? null : onClick || null}
            disabled={disabled}
            title={title}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handeKeyDown : onKeyDown}
            autoFocus={autoFocus}
            ref={refNode}
            {...props}
        >
            {icon && <i className={icon} />}
            {!iconOnly && text}
            {children}
        </button>
    );
};

Button.propTypes = {
    id: PropTypes.string,
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
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'alert', 'highlight', 'sd-green', 'ui-dark', 'default']),
    size: PropTypes.oneOf(['small', 'large']),
    tabIndex: PropTypes.number,
    enterKeyIsClick: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onKeyDown: PropTypes.func,
    refNode: PropTypes.func,
    iconOnlyCircle: PropTypes.bool,
    children: PropTypes.node,
    pullRight: PropTypes.bool,
    empty: PropTypes.bool,
};

Button.defaultProps = {
    disabled: false,
    textOnly: false,
    hollow: false,
    iconOnly: false,
    expanded: false,
    enterKeyIsClick: false,
    autoFocus: false,
    iconOnlyCircle: false,
    pullRight: false,
    empty: false,
};

export default Button;
