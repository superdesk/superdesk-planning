import {IEditorFieldProps} from '../../../interfaces';

export interface IEditorFieldEventRecurringRulesProps extends IEditorFieldProps {
    onlyUpdateRepetitions?: boolean;
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}
