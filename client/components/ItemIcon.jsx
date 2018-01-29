import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils} from '../utils';

export const ItemIcon = ({item, big, white, blue, showRepeating}) => {
    const getItemIcon = () => {
        const eventIcon = (
            <i className={classNames(
                'sd-list-item__item-type',
                'icon-calendar-list',
                {
                    'icon--white': white,
                    'icon--blue': blue
                })}
            />
        );

        const repeatIcon = (
            <i className={classNames(
                'icon-repeat icn-mix__sub-icn',
                {
                    'double-size-icn': big,
                    'icon--white': white,
                    'icon--blue': blue
                })}
            />
        );

        const planningIcon = (
            <i className={classNames(
                'sd-list-item__item-type',
                'icon-calendar',
                {
                    'icon--white': white,
                    'icon--blue': blue
                }
            )}/>
        );

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

        if (!showRepeating || !multiValidator(item)) {
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
    white: PropTypes.bool,
    blue: PropTypes.bool,
    showRepeating: PropTypes.bool,
};

ItemIcon.defaultProps = {
    white: false,
    blue: false,
    showRepeating: true,
};
