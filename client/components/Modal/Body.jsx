import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';

export default function Body({children}) {
    return (
        <_Modal.Body className="modal__body">
            {children}
        </_Modal.Body>);
}

Body.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
};
