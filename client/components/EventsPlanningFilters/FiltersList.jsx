import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {List} from '../UI';
import {FilterItem} from './FilterItem';

export const FiltersList = ({
    filters,
    privileges,
    deleteFilter,
    editFilter,
    calendars,
    agendas,
}) => {
    const filterItems = get(filters, 'length', 0) > 0 ? filters.map((filter) => (
        <FilterItem
            filter={filter}
            privileges={privileges}
            editFilter={editFilter}
            deleteFilter={deleteFilter}
            key={filter._id}
            calendars={calendars}
            agendas={agendas}
        />
    )) :
        <span>{gettext('There are no events and planing view filters.')}</span>;

    return (
        <List.Group spaceBetween={true}>
            { filterItems }
        </List.Group>
    );
};

FiltersList.propTypes = {
    filters: PropTypes.array.isRequired,
    privileges: PropTypes.object.isRequired,
    deleteFilter: PropTypes.func.isRequired,
    editFilter: PropTypes.func,
    calendars: PropTypes.array.isRequired,
    agendas: PropTypes.array.isRequired,
};