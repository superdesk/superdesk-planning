import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../constants';
import {EventEditor} from '../Events';

export const EditorContentTab = ({item, itemType, diff, onChangeHandler}) => {
    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventEditor
                item={item || diff}
                diff={diff}
                onChangeHandler={onChangeHandler}
            />
        );
    }

    return null;
};

EditorContentTab.propTypes = {
    item: PropTypes.object,
    itemType: PropTypes.string,
    diff: PropTypes.object.isRequired,
    onChangeHandler: PropTypes.func.isRequired,
};
