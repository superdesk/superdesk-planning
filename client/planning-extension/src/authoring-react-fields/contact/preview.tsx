import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IContactFieldConfig, IContactValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<IContactValueOperational, IContactFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // not implemented
        return null;
    }
}
