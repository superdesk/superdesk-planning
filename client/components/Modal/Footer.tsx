import React from 'react';
import {Modal as _Modal} from 'react-bootstrap';
import classNames from 'classnames';

export default function Footer({children, flex}: {children: React.ReactNode; flex?: boolean;}) {
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
