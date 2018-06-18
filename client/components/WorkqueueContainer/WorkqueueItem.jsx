import React from 'react';
import PropTypes from 'prop-types';

import {ICON_COLORS} from '../../constants';
import {isExistingItem, getItemId} from '../../utils';

import {ItemIcon} from '../';
import {Icon} from '../UI';

export const WorkqueueItem = ({
    item,
    currentEditId,
    onOpen,
    onClose,
}) => {
    const isActive = getItemId(item) === currentEditId;

    return (
        <li className={isActive ? ' workqueue-item active' : 'workqueue-item'}>
            <a className="title" onClick={onOpen.bind(null, item)}>
                <ItemIcon
                    item={item}
                    color={isActive ? ICON_COLORS.WHITE : ICON_COLORS.BLUE}
                    showRepeating={false}
                />
                <span className="item-label">
                    {item.headline || item.slugline || 'Untitled'}
                    {!isExistingItem(item) && '*'}
                </span>
            </a>

            <button className="close" onClick={onClose.bind(null, item)}>
                <Icon icon="icon-close-small" color={ICON_COLORS.WHITE} />
            </button>
        </li>
    );
};

WorkqueueItem.propTypes = {
    item: PropTypes.object,
    currentEditId: PropTypes.string,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
};
