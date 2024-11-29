import * as React from 'react';
import {IAttachmentsFieldConfig, IAttachmentsValueOperational} from './interfaces';
import {IDifferenceComponentProps} from 'superdesk-api';

type IProps = IDifferenceComponentProps<IAttachmentsValueOperational, IAttachmentsFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        return null; // not implemented
    }
}
