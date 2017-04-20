import React from 'react'
import { Modal as _Modal } from 'react-bootstrap'

export default function Header({ children }) {
    return (
        <_Modal.Header className="modal__header">
            {children}
        </_Modal.Header>)
}

Header.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.arrayOf(React.PropTypes.element),
    ]),
}
