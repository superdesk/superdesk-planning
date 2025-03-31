import {PureComponent, ReactNode} from 'react';
import {IRecurringRulesFieldConfig, IRecurringRulesValueOperational} from './interfaces';
import {IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<IRecurringRulesValueOperational, IRecurringRulesFieldConfig>;

export class Preview extends PureComponent<IProps> {
    render(): ReactNode {
        return null;
    }
}
