import React from 'react'
import PropTypes from 'prop-types'

export const Row = ({ children }) => (
    <div className="sd-list-item__row">
        {children}
    </div>
)

Row.propTypes = { children: PropTypes.node.isRequired }
