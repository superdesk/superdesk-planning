import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {ICoveragesFieldConfig, ICoveragesValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<ICoveragesValueOperational, ICoveragesFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // not implemented
        return null;
    }
}
