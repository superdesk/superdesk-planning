import {
    IEditorFieldProps,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningItem
} from '../../../interfaces';
import {IArticle} from 'superdesk-api';


// can't import CoverageEditor from '../../Coverages' because it would break compilation of planning extension
type CoverageEditor = any;

export interface IPropsEditorFieldCoverages extends IEditorFieldProps {
    item: IPlanningItem;
    addButtonText?: string; // defaults to 'Add a coverage'
    addNewsItemToPlanning?: IArticle;
    useLocalNavigation?: boolean;
    navigation?: any;
    maxCoverageCount?: number;
    addOnly?: boolean;
    originalCount?: number;
    message: string | {[key: string]: any};
    event?: IEventItem;

    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    notifyValidationErrors(errors: Array<string>): void;
    getRef?(field: string, value: IPlanningCoverageItem): React.RefObject<CoverageEditor>;
}
