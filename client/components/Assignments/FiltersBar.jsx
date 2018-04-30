import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {SubNav, StretchBar} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import OrderBar from '../OrderBar';

export const FiltersBar = ({
    filterBy,
    orderByField,
    orderDirection,
    changeFilter,
    myAssignmentsCount,
}) => (
    <SubNav>
        <StretchBar>
            <Checkbox
                label={gettext('Desk Assignments')}
                onChange={() => changeFilter('All', orderByField, orderDirection)}
                value={'All'}
                checkedValue={filterBy}
                type="radio"
                labelPosition="inside"
            />

            <div className="element-with-badge">
                <Checkbox
                    label={gettext('My Assignments')}
                    onChange={() => changeFilter('User', orderByField, orderDirection)}
                    value={'User'}
                    checkedValue={filterBy}
                    type="radio"
                    labelPosition="inside"
                />
                <span className="badge badge--highlight">
                    {myAssignmentsCount}
                </span>
            </div>
        </StretchBar>

        <OrderBar
            orderByField={orderByField}
            orderDirection={orderDirection}
            fields={['Created', 'Updated', 'Priority']}
            onChange={
                (orderByField, orderDirection) => changeFilter(filterBy, orderByField, orderDirection)
            }
        />
    </SubNav>
);

FiltersBar.propTypes = {
    filterBy: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    changeFilter: PropTypes.func.isRequired,
};

FiltersBar.defaultProps = {
    filterBy: 'All',
    myAssignmentsCount: 0,
    orderByField: 'Updated',
    orderDirection: 'Asc',
};
