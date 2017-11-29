import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export const Column = ({ children, grow, border, justifyTop, noPadding }) => (
    <div className={classNames(
        'sd-list-item__column',
        { 'sd-list-item__column--grow': grow },
        { 'sd-list-item__column--no-border': !border },
        { 'sd-list-item__column--justify-top': justifyTop },
        { 'sd-list-item__column--no-padding': noPadding }
    )}>
        {children}
    </div>
)

Column.propTypes = {
    children: PropTypes.node.isRequired,
    grow: PropTypes.bool,
    border: PropTypes.bool,
    justifyTop: PropTypes.bool,
    noPadding: PropTypes.bool,
}

Column.defaultProps = {
    grow: false,
    border: true,
    justifyTop: false,
    noPadding: false,
}
