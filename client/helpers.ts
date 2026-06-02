import moment from 'moment';
import {GENERIC_ITEM_ACTIONS} from './constants';
import {IDateTime, IItemAction} from './interfaces';
import {IVocabulary} from 'superdesk-api';
import {isEmpty, partition} from 'lodash';
import {superdeskApi} from './superdeskApi';
import {ILineConfig} from 'globals';

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

export function isSameDay(startingDate: IDateTime, endingDate: IDateTime): boolean {
    return moment(startingDate).format('DD/MM/YYYY') === moment(endingDate).format('DD/MM/YYYY');
}

export function isCustomVocabulary(vocabulary: IVocabulary) {
    return !isEmpty(vocabulary.service) && isEmpty(vocabulary.field_type);
}

export const partitionLineItems = (items: Array<ILineConfig>) => partition(items, ({position = 'start'}) => {
    if (position === 'start') {
        return true;
    } else if (position === 'end') {
        return false;
    } else {
        return superdeskApi.helpers.assertNever(position);
    }
});
