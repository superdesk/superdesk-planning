import React from 'react';
import PropTypes from 'prop-types';
import {gettext, planningUtils} from '../../utils';
import {PRIVILEGES, TOOLTIPS} from '../../constants';
import {List} from '../UI';
import {calendars as Calendars} from '../fields/calendars';
import {agendas as Agendas} from '../fields/agendas';

export const FilterItem = ({
    filter,
    privileges,
    editFilter,
    deleteFilter,
    calendars,
    agendas,
}) => (
    <List.Item shadow={1}>
        <List.Column grow={true} border={false}>
            <List.Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">{filter.name}</span>
                <time>{gettext('updated') + ' ' + moment(filter._updated).fromNow()}</time>
            </List.Row>
            <List.Row>
                <Calendars item={filter} calendars={calendars} grow={true}/>
            </List.Row>
            <List.Row>
                <Agendas
                    item={filter}
                    agendas={planningUtils.getAgendaNames(filter, agendas)}
                />
            </List.Row>
        </List.Column>
        {!!privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] &&
            <List.ActionMenu>
                {editFilter && <button onClick={editFilter.bind(null, filter)} className="dropdown__toggle"
                    data-sd-tooltip={gettext(TOOLTIPS.editFilter)} data-flow="left">
                    <i className="icon-pencil"/>
                </button>}
                <button onClick={deleteFilter.bind(null, filter)} className="dropdown__toggle"
                    data-sd-tooltip={gettext(TOOLTIPS.deleteFilter)} data-flow="left">
                    <i className="icon-trash"/>
                </button>
            </List.ActionMenu>
        }
    </List.Item>
);


FilterItem.propTypes = {
    filter: PropTypes.object.isRequired,
    privileges: PropTypes.object.isRequired,
    editFilter: PropTypes.func,
    deleteFilter: PropTypes.func.isRequired,
    calendars: PropTypes.array.isRequired,
    agendas: PropTypes.array.isRequired,
};
