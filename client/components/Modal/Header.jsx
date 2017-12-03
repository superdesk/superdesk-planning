import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';

export default function Header({children}) {
    return (
        <_Modal.Header className="modal__header">
            {children}
        </_Modal.Header>);
}

Header.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
};
