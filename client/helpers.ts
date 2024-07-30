import {GENERIC_ITEM_ACTIONS} from './constants';
import {IItemAction} from './interfaces';

export function isItemAction(
    x: IItemAction | typeof GENERIC_ITEM_ACTIONS.DIVIDER | typeof GENERIC_ITEM_ACTIONS.LABEL,
): x is IItemAction {
    return x['label'] != null && x['label'] !== GENERIC_ITEM_ACTIONS.DIVIDER.label;
}

export function isMenuDivider(
    x: IItemAction | typeof GENERIC_ITEM_ACTIONS.DIVIDER | typeof GENERIC_ITEM_ACTIONS.LABEL,
): x is typeof GENERIC_ITEM_ACTIONS.DIVIDER {
    return x['label'] != null && x['label'] === GENERIC_ITEM_ACTIONS.DIVIDER.label;
}