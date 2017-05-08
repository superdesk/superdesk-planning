import React from 'react'
import { Modal as _Modal } from 'react-bootstrap'

export default function Body({ children }) {
    return (
        <_Modal.Body className="modal__body">
            {children}
        </_Modal.Body>)
}

Body.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.arrayOf(React.PropTypes.element),
    ]),
}
