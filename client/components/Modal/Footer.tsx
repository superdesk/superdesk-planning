import React from 'react';
import {Modal as _Modal} from 'react-bootstrap';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    flex?: boolean;
}

export default function Footer({children, flex}: IProps) {
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

