import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {ICON_COLORS} from '../../constants';
import {ItemIcon} from '../';

export const WorkqueueItem = ({
    item,
    currentEditId,
    onOpen,
    onClose,
}) => {
    const isActive = get(item, '_id') === currentEditId;

    return (
        <li className={isActive ? 'active' : ''}>
            <a className="title" onClick={onOpen.bind(null, item)}>
                <ItemIcon
                    item={item}
                    color={isActive ? ICON_COLORS.WHITE : ICON_COLORS.BLUE}
                    showRepeating={false}
                />
                <span className="item-label">
                    {item.headline || item.slugline || 'Untitled'}
                </span>
            </a>

            <button className="close" onClick={onClose.bind(null, item)}>
                <i className="icon-close-small icon--white" />
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
