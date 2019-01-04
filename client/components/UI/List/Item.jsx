import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Item
 * @description Component to encapsulate a list item
 */
export const Item = (
    {
        children,
        noBg,
        noHover,
        shadow,
        activated,
        className,
        onClick,
        margin,
        disabled,
        onMouseEnter,
        onMouseLeave,
        refNode,
    }) => (
    <div className={classNames(
        className,
        'sd-list-item',
        {
            'sd-list-item--no-bg': noBg,
            'sd-list-item--no-hover': noHover,
            'sd-list-item--margin': margin,
            'sd-list-item--activated': activated,
            [`sd-shadow--z${shadow}`]: shadow,
            'sd-list-item--disabled': disabled,
        }
    )}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    ref={refNode}
    >
        {children}
    </div>
);

Item.propTypes = {
    children: PropTypes.node.isRequired,
    noBg: PropTypes.bool,
    noHover: PropTypes.bool,
    shadow: PropTypes.oneOf([1, 2, 3, 4]),
    activated: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    margin: PropTypes.bool,
    disabled: PropTypes.bool,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    refNode: PropTypes.func,
};

Item.defaultProps = {
    noBg: false,
    noHover: false,
    margin: false,
    disabled: false,
    onClick: () => { /* no-op */ },
    onMouseEnter: () => { /* no-op */ },
    onMouseLeave: () => { /* no-op */ },
};
