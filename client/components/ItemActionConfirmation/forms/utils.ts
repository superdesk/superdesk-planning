import {IAssignmentOrPlanningItem} from '../../../interfaces';
import {planningApi} from '../../../superdeskApi';

interface IModalProps {
    onCloseModal?(item: IAssignmentOrPlanningItem): void;
}

export function onItemActionModalHide(
    original: IAssignmentOrPlanningItem,
    unlockItem: boolean,
    modalProps:IModalProps
) {
    return (
        unlockItem ?
            planningApi.locks.unlockItem(original) :
            Promise.resolve(original)
    ).then((updatedItem) => {
        if (modalProps?.onCloseModal != null) {
            modalProps.onCloseModal(updatedItem);
        }
    });
}
