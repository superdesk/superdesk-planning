import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from '../Events';
import {PlanningDateTime} from './';

import {planningUtils, getItemWorkflowStateLabel} from '../../utils';

export const PlanningItem = ({
    item,
    onClick,
    lockedItems,
    dateFormat,
    timeFormat,
    agendas,
    date,
}) => {
    if (!item) {
        return null;
    }

    const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems);
    const state = getItemWorkflowStateLabel(item);
    const event = get(item, 'event');

    let borderState = false;

    if (isItemLocked)
        borderState = 'locked';

    const agendaNames = item.agendas
        .map((agendaId) => agendas.find((agenda) => agenda._id === agendaId))
        .filter((agenda) => agenda)
        .map((agenda) => agenda.name)
        .join(', ');

    return (
        <Item shadow={1} onClick={onClick}>
            <Border state={borderState} />
            <ItemType item={item} onCheckToggle={() => { /* no-op */ }}/>
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
                        {item.description_text}
                    </span>

                    {event &&
                        <span className="sd-no-wrap">
                            <i className="icon-calendar-list sd-list-item__inline-icon"/>
                            <EventDateTime
                                item={event}
                                dateFormat={dateFormat}
                                timeFormat={timeFormat}
                            />
                        </span>
                    }
                </Row>
                <Row>
                    <span className="sd-list-item__text-label">agenda:</span>
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-grow">
                        {agendaNames}
                    </span>
                    <PlanningDateTime
                        item={item}
                        date={date}
                        timeFormat={timeFormat}
                    />
                </Row>
            </Column>
            <ActionMenu>
                <div className="dropdown dropdown--align-right">
                    <button className="icn-btn dropdown__toggle dropdown-toggle">
                        <i className="icon-dots-vertical" />
                    </button>
                </div>
            </ActionMenu>
        </Item>
    );
};

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
};
