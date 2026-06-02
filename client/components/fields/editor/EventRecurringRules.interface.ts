import {IEditorFieldProps, IEventItem} from '../../../interfaces';

export interface IEditorFieldEventRecurringRulesProps extends IEditorFieldProps {
    onlyUpdateRepetitions?: boolean;
    noPadding?: boolean;
    originalItem?: IEventItem;
}
