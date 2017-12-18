import React from 'react';
import PropTypes from 'prop-types';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from './';

import {eventUtils, getItemWorkflowStateLabel} from '../../utils';

export const EventItem = ({item, onClick, lockedItems, dateFormat, timeFormat}) => {
    if (!item) {
        return null;
    }

    const hasPlanning = eventUtils.eventHasPlanning(item);
    const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
    const state = getItemWorkflowStateLabel(item);

    let borderState = false;

    if (isItemLocked)
        borderState = 'locked';
    else if (hasPlanning)
        borderState = 'active';

    return (
        <Item shadow={1} onClick={onClick}>
            <Border state={borderState} />
            <ItemType item={item} onCheckToggle={() => { /* no-op */ }} />
            <PubStatus item={item} />
            <Column
                grow={true}
                border={false}
            >
                <Row>
                    <Label
                        text={state.label}
                        iconType={state.iconType}
                    />
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                            <span className="sd-list-item__slugline">{item.slugline}</span>
                        }
                        {item.name}
                    </span>
                    <EventDateTime
                        item={item}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                    />
                </Row>
            </Column>
            <ActionMenu>
                <button className="icn-btn">
                    <i className="icon-dots-vertical" />
                </button>
            </ActionMenu>
        </Item>
    );
};

EventItem.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};
