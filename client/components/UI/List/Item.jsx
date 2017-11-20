import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export const Item = ({ children, noBg, noHover, shadow, activated, className, onClick, draggable, onDragStart }) => (
    <div className={classNames(
        className,
        'ListItem',
        'sd-list-item',
        { 'sd-list-item--no-bg': noBg },
        { 'sd-list-item--no-hover': noHover },
        shadow ? `sd-shadow--z${shadow}` : null,
        { 'sd-list-item--activated': activated }
    )}
         onClick={onClick}
         draggable={draggable}
         onDragStart={onDragStart}
    >
        {children}
    </div>
)

Item.propTypes = {
    children: PropTypes.node.isRequired,
    noBg: PropTypes.bool,
    noHover: PropTypes.bool,
    shadow: PropTypes.oneOf([1, 2, 3, 4]),
    activated: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    draggable: PropTypes.bool,
    onDragStart: PropTypes.func,
}

Item.defaultProps = {
    noBg: false,
    noHover: false,
}
