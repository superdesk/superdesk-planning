import React from 'react';
import {Modal as _Modal} from 'react-bootstrap';

interface IProps {
    children: React.ReactNode;
}

export default function Header({children}: IProps) {
    return (
        <_Modal.Header className="modal__header modal__header--flex">
            {children}
        </_Modal.Header>
    );
}
