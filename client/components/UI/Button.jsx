import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

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
    iconOnly
}) => (
    <div
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
        onClick={onClick || null}
        title={title || text}
    >
        {icon && <i className={icon} />}
        {!iconOnly && text}
    </div>
);

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
};

Button.defaultProps = {
    disabled: false,
    textOnly: false,
    hollow: false,
    iconOnly: false,
    expanded: false
};

export default Button;
