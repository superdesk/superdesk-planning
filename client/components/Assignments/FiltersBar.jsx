import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';

import {SubNav, StretchBar} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import OrderBar from '../OrderBar';
import {DesksSubnavDropdown} from '../Main';


export const FiltersBar = ({
    filterBy,
    orderByField,
    orderDirection,
    changeFilter,
    myAssignmentsCount,
    userDesks,
    selectedDeskId,
    selectDesk,
}) => (
    <SubNav>
        <StretchBar>
            {get(userDesks, 'length', 0) === 0 && <Checkbox
                label={gettext('Desk Assignments')}
                onChange={() => changeFilter('Desk', orderByField, orderDirection, selectedDeskId)}
                value={'Desk'}
                checkedValue={filterBy}
                type="radio"
                labelPosition="inside"
            />}

            {get(userDesks, 'length', 0) > 0 && <DesksSubnavDropdown
                userDesks={userDesks}
                selectedDeskId={selectedDeskId}
                selectDesk={selectDesk}
            />}

            <div className="element-with-badge">
                <Checkbox
                    label={gettext('My Assignments')}
                    onChange={() => changeFilter('User', orderByField, orderDirection, selectedDeskId)}
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
                (orderByField, orderDirection) => changeFilter(filterBy, orderByField, orderDirection, selectedDeskId)
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
    userDesks: PropTypes.array,
    selectedDeskId: PropTypes.string,
    selectDesk: PropTypes.func,
};

FiltersBar.defaultProps = {
    filterBy: 'Desk',
    myAssignmentsCount: 0,
    orderByField: 'Updated',
    orderDirection: 'Asc',
    userDesks: [],
    selectedDeskId: '',
};
