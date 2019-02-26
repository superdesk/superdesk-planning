import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {SubNav, StretchBar} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import OrderBar from '../OrderBar';
import {DesksSubnavDropdown} from './DesksSubNavDropDown';
import {WORKSPACE} from '../../constants';


export const FiltersBar = ({
    filterBy,
    orderByField,
    orderDirection,
    changeFilter,
    myAssignmentsCount,
    userDesks,
    selectedDeskId,
    selectAssignmentsFrom,
    workspace,
}) => (
    <SubNav>
        <StretchBar>
            {workspace === WORKSPACE.ASSIGNMENTS &&
            <Fragment>
                <Checkbox
                    label={gettext('Desk Assignments')}
                    onChange={() => changeFilter('Desk', orderByField, orderDirection, selectedDeskId)}
                    value={'Desk'}
                    checkedValue={filterBy}
                    type="radio"
                    labelPosition="inside"
                />
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
            </Fragment>
            }

            {workspace === WORKSPACE.AUTHORING && <DesksSubnavDropdown
                userDesks={userDesks}
                selectedDeskId={selectedDeskId}
                selectAssignmentsFrom={selectAssignmentsFrom}
            />}
        </StretchBar>

        <OrderBar
            orderByField={orderByField}
            orderDirection={orderDirection}
            fields={[gettext('Created'), gettext('Updated'), gettext('Priority'), gettext('Scheduled')]}
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
    selectAssignmentsFrom: PropTypes.func,
    workspace: PropTypes.string,
};

FiltersBar.defaultProps = {
    filterBy: 'Desk',
    myAssignmentsCount: 0,
    orderByField: 'Updated',
    orderDirection: 'Asc',
    userDesks: [],
    selectedDeskId: '',
    workspace: '',
};
