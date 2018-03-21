import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils, gettext} from '../utils';

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

        const archiveIcon = (
            <i className={classNames(
                'sd-list-item__item-type',
                planningUtils.getCoverageIcon(item.type),
                {
                    'icon--white': white,
                    'icon--blue': blue
                }
            )}/>
        );

        const itemType = getItemType(item);

        let icon = eventIcon;
        let title = 'Event';
        let multiValidator = eventUtils.isEventRecurring;

        if (itemType === ITEM_TYPE.PLANNING) {
            icon = planningIcon;
            title = 'Planning';
            multiValidator = planningUtils.isPlanMultiDay;
        } else if (itemType !== ITEM_TYPE.EVENT) {
            icon = archiveIcon;
            multiValidator = () => false;
        }

        if (!icon) {
            return null;
        }

        let iconElement = <span>{icon}</span>;


        if (!showRepeating || !multiValidator(item)) {
            title = gettext(title);

            iconElement = big ?
                (<span className="double-size-icn double-size-icn--light">
                    {icon}
                </span>) : iconElement;
        } else {
            title = gettext(`Recurring ${title}`);

            iconElement = big ?
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

        return (
            <OverlayTrigger
                overlay={<Tooltip id="icon_list_item">{title}</Tooltip>}
            >
                {iconElement}
            </OverlayTrigger>
        );
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
