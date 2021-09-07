import React from 'react';
import PropTypes from 'prop-types';

import {superdeskApi} from '../../superdeskApi';

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
    const {gettext} = superdeskApi.localization;
    const isActive = getItemId(item) === currentEditId;

    return (
        <li
            className={isActive ?
                'opened-articles-bar__item opened-articles-bar__item--active' :
                'opened-articles-bar__item'
            }
            data-test-id="workqueue-item"
            data-active={isActive}
        >
            <a
                className="opened-articles-bar__item-title"
                onClick={onOpen.bind(null, item)}
                data-test-id="workqueue-item--title"
            >
                <ItemIcon
                    item={item}
                    color={isActive ? ICON_COLORS.WHITE : ICON_COLORS.BLUE}
                    showRepeating={false}
                />
                <span>
                    {item.headline || item.slugline || item.name || gettext('Untitled')}
                    {!isExistingItem(item) && '*'}
                </span>
            </a>

            <button
                className="opened-articles-bar__item-close"
                onClick={onClose.bind(null, item)}
                data-test-id="close-icon"
            >
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
