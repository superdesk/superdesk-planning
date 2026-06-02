import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IAttachmentsFieldConfig, IAttachmentsValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<IAttachmentsValueOperational, IAttachmentsFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // not implemented
        return null;
    }
}
