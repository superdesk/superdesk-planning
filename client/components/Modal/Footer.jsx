import React from 'react'
import { Modal as _Modal } from 'react-bootstrap'

export default function Footer({ children }) {
    return (
        <_Modal.Footer className="modal__footer">
            {children}
        </_Modal.Footer>)
}

Footer.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.arrayOf(React.PropTypes.element),
    ]),
}
