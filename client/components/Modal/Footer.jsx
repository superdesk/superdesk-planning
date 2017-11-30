import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';

export default function Footer({children}) {
    return (
        <_Modal.Footer className="modal__footer">
            {children}
        </_Modal.Footer>);
}

Footer.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
};
