import React from 'react';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {ItemIcon} from '../../';

export const ItemType = ({onCheckToggle, item}) => (
    <Column hasCheck={!!onCheckToggle}>
        {onCheckToggle && (
            <div className="sd-list-item__checkbox-container" onClick={onCheckToggle}>
                <span className="sd-check__wrapper">
                    <span className="sd-checkbox"/>
                </span>
            </div>
        )}
        <ItemIcon item={item} />
    </Column>
);

ItemType.propTypes = {
    onCheckToggle: PropTypes.func,
    item: PropTypes.object.isRequired,
};
