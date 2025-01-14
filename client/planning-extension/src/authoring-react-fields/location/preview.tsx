import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<ILocationValueOperational, ILocationFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // not implemented
        return null;
    }
}
