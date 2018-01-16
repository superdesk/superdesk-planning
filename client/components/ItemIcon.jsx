import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils} from '../utils';

export const ItemIcon = ({item, big}) => {
    const getItemIcon = () => {
        const eventIcon = (<i className="icon-calendar-list" />);
        const repeatIcon = (<i className={
            classNames('icon-repeat icn-mix__sub-icn',
                {'double-size-icn': big})} />);
        const planningIcon = (<i className="icon-calendar"/>);

        const itemType = getItemType(item);

        let icon = eventIcon;
        let multiValidator = eventUtils.isEventRecurring;

        if (itemType === ITEM_TYPE.PLANNING) {
            icon = planningIcon;
            multiValidator = planningUtils.isPlanMultiDay;
        }

        if (!icon) {
            return null;
        }

        if (!multiValidator(item)) {
            return big ?
                (<span className="double-size-icn double-size-icn--light">
                    {icon}
                </span>) : icon;
        } else {
            return big ?
                (<span className="icn-mix sd-list-item__item-type">
                    {repeatIcon}
                    <span className="double-size-icn double-size-icn--light">
                        {icon}
                    </span>
                </span>) :
                (<span className="icn-mix sd-list-item__item-type">
                    {repeatIcon}
                    {icon}
                </span>);
        }
    };

    return getItemIcon();
};

ItemIcon.propTypes = {
    item: PropTypes.object.isRequired,
    big: PropTypes.bool,
};
