import React from 'react';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {ItemIcon} from '../../';
import {Checkbox} from '../Form';

export const ItemType = ({hasCheck, checked, onCheckToggle, item}) => (
    <Column hasCheck={hasCheck} checked={checked} >
        {hasCheck && (
            <div className="sd-list-item__checkbox-container">
                <Checkbox value={checked} onChange={(field, value) => {
                    onCheckToggle(value);
                }}/>
            </div>
        )}
        <ItemIcon item={item} />
    </Column>
);

ItemType.propTypes = {
    onCheckToggle: PropTypes.func,
    item: PropTypes.object.isRequired,
    checked: PropTypes.bool,
    hasCheck: PropTypes.bool,
};
