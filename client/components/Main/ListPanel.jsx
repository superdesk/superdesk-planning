import React from 'react';
import PropTypes from 'prop-types';
import {ListGroup} from './';
import {PanelInfo} from '../UI';

export const ListPanel = ({groups, onItemClick, onDoubleClick, lockedItems, dateFormat, timeFormat, agendas}) => (
    groups.length <= 0 ? (
        <div className="sd-column-box__main-column">
            <PanelInfo
                heading="No Event or Planning items found"
                description="Create new items or change your search filters"
            />
        </div>
    ) : (
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
                    agendas={agendas}
                />
            ))}
        </div>
    )
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
    agendas: PropTypes.array.isRequired,
};
