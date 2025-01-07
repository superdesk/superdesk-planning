import React from 'react';
import {Modal as _Modal} from 'react-bootstrap';

export default function Header({children}: {children: React.ReactNode}) {
    return (
        <_Modal.Header className="modal__header modal__header--flex">
            {children}
        </_Modal.Header>
    );
}
