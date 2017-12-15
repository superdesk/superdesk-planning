import React from 'react';
import PropTypes from 'prop-types';

import {Column} from './Column';

import {ITEM_TYPE} from '../../../constants';
import {getItemType, eventUtils, planningUtils} from '../../../utils';

export const ItemType = ({onCheckToggle, item}) => {
    let span;
    const itemType = getItemType(item);

    if (itemType === ITEM_TYPE.EVENT) {
        if (eventUtils.isEventRecurring(item)) {
            span = (
                <span className="icn-mix sd-list-item__item-type">
                    <i className="icon-repeat icn-mix__sub-icn"/>
                    <i className="icon-calendar-list"/>
                </span>
            );
        } else {
            span = (
                <span className="sd-list-item__item-type">
                    <i className="icon-calendar-list"/>
                </span>
            );
        }
    } else if (itemType === ITEM_TYPE.PLANNING) {
        if (planningUtils.isPlanMultiDay(item)) {
            span = (
                <span className="icn-mix sd-list-item__item-type">
                    <i className="icon-repeat icn-mix__sub-icn"/>
                    <i className="icon-calendar"/>
                </span>
            );
        } else {
            span = (
                <span className="sd-list-item__item-type">
                    <i className="icon-calendar"/>
                </span>
            );
        }
    }

    return (
        <Column hasCheck={!!onCheckToggle}>
            {onCheckToggle && (
                <div className="sd-list-item__checkbox-container" onClick={onCheckToggle}>
                    <span className="sd-check__wrapper">
                        <span className="sd-checkbox"/>
                    </span>
                </div>
            )}

            {span}
        </Column>
    );
};

ItemType.propTypes = {
    onCheckToggle: PropTypes.func,
    item: PropTypes.object.isRequired,
};
