import React from 'react';
import PropTypes from 'prop-types';
import {ITEM_TYPE} from '../../../constants';
import {EventEditor} from '../../Events';
import {PlanningEditor} from '../../Planning';

export const EditorContentTab = ({
    item,
    itemType,
    diff,
    onChangeHandler,
    readOnly,
    submitFailed,
    errors,
    addNewsItemToPlanning,
}) => {
    switch (itemType) {
    case ITEM_TYPE.EVENT:
        return (
            <EventEditor
                item={item || {}}
                diff={diff}
                onChangeHandler={onChangeHandler}
                readOnly={readOnly}
                submitFailed={submitFailed}
                errors={errors}
            />
        );
    case ITEM_TYPE.PLANNING:
        return (
            <PlanningEditor
                item={item || {}}
                diff={diff}
                onChangeHandler={onChangeHandler}
                readOnly={readOnly}
                addNewsItemToPlanning={addNewsItemToPlanning}
                submitFailed={submitFailed}
                errors={errors}
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
    addNewsItemToPlanning: PropTypes.object,
    submitFailed: PropTypes.bool,
    errors: PropTypes.object,
};

EditorContentTab.defaultProps = {readOnly: false};
