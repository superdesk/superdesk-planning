import {PureComponent, ReactNode} from 'react';
import {IEventDateFieldConfig, IEventDateValueOperational} from './interfaces';
import {IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<IEventDateValueOperational, IEventDateFieldConfig>;

export class Preview extends PureComponent<IProps> {
    render(): ReactNode {
        return null;
    }
}
