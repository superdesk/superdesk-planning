import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../constants';
import {EventEditor} from '../Events';
import {PlanningEditor} from '../Planning';

export const EditorContentTab = ({item, itemType, diff, onChangeHandler, readOnly}) => {
    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventEditor
                item={item || diff}
                diff={diff}
                onChangeHandler={onChangeHandler}
                readOnly={readOnly}
            />
        );
    case ITEM_TYPE.PLANNING:
        return (
            <PlanningEditor
                item={item || diff}
                diff={diff}
                onChangeHandler={onChangeHandler}
                readOnly={readOnly}
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
    readOnly: PropTypes.bool,
};

EditorContentTab.defaultProps = {readOnly: false};
