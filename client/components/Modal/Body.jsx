import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import classNames from 'classnames';

export default function Body({children, noPadding, fullHeight}) {
    return (
        <_Modal.Body
            className={classNames(
                'modal__body',
                {
                    'modal__body--no-padding': noPadding,
                    'modal__body--full-height': fullHeight
                }
            )}>
            {children}
        </_Modal.Body>);
}

Body.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    noPadding: PropTypes.bool,
    fullHeight: PropTypes.bool,
};
