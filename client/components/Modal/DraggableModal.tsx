import React from 'react';
import Draggable from 'react-draggable';
import {default as ModalDialog} from './ModalDialog';

export default function DraggableModalDialog({...props}) {
    return (<Draggable handle=".modal__header"><ModalDialog {...props} /></Draggable>);
}