import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import classNames from 'classnames';

export default function Footer({children, flex}) {
    return (
        <_Modal.Footer
            className={classNames(
                'modal__footer',
                {'sd-d-flex': flex}
            )}
        >
            {children}
        </_Modal.Footer>
    );
}

Footer.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    flex: PropTypes.bool,
};
