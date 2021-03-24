import React from 'react';
import PropTypes from 'prop-types';
import {get, values} from 'lodash';

import {ITEM_TYPE, ICON_COLORS} from '../constants';
import {getItemType, eventUtils, planningUtils, gettext} from '../utils';

import {IconMix} from './UI';

export const ItemIcon = ({item, big, showRepeating, doubleSize, color}) => {
    if (!item) {
        return null;
    }

    const itemType = getItemType(item);
    let icon;
    let subIcon = null;
    let tooltip;

    if (itemType === ITEM_TYPE.EVENT) {
        icon = 'icon-event';
        if (!showRepeating || !eventUtils.isEventRecurring(item)) {
            tooltip = gettext('Event');
        } else {
            subIcon = 'icon-repeat';
            tooltip = gettext('Recurring Event');
        }
    } else if (itemType === ITEM_TYPE.PLANNING) {
        icon = 'icon-calendar';
        tooltip = gettext('Planning');

        if (planningUtils.isPlanMultiDay(item)) {
            subIcon = 'icon-repeat';
        }
    } else {
        icon = planningUtils.getCoverageIcon(get(item, 'type'));
        tooltip = gettext('Planning');
    }

    return (
        <IconMix
            icon={icon}
            subIcon={subIcon}
            className="sd-list-item__item-type"
            big={big}
            doubleSize={doubleSize}
            tooltip={tooltip}
            color={color}
        />
    );
};

ItemIcon.propTypes = {
    item: PropTypes.object,
    big: PropTypes.bool,
    showRepeating: PropTypes.bool,
    doubleSize: PropTypes.bool,
    color: PropTypes.oneOf(values(ICON_COLORS)),
};

ItemIcon.defaultProps = {
    showRepeating: true,
    doubleSize: false,
};
