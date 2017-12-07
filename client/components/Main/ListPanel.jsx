import React from 'react';
import PropTypes from 'prop-types';
import {ListGroup} from './';

export const ListPanel = ({groups, onItemClick, onDoubleClick, lockedItems, dateFormat, timeFormat}) => (
    <div className="sd-column-box__main-column">
        {groups.map((group) => (
            <ListGroup
                key={group.date}
                name={group.date}
                items={group.events}
                onItemClick={onItemClick}
                onDoubleClick={onDoubleClick}
                lockedItems={lockedItems}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
            />
        ))}
    </div>
);

ListPanel.propTypes = {
    groups: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    lockedItems: PropTypes.object.isRequired,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};
