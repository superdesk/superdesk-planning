import * as React from 'react';
import {ICoveragesFieldConfig, ICoveragesValueOperational} from './interfaces';
import {IDifferenceComponentProps} from 'superdesk-api';

type IProps = IDifferenceComponentProps<ICoveragesValueOperational, ICoveragesFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        return null; // not implemented
    }
}
