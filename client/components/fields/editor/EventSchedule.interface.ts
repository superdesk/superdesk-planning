import {IEditorFieldProps, IEventItem} from '../../../interfaces';

export interface IEventScheduleFieldProps extends IEditorFieldProps {
    item: IEventItem;
    canClear?: boolean;
    showAllDay?: boolean;
    showTimeZone?: boolean;
}
