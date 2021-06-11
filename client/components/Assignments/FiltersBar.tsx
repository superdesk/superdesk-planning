import React, {Fragment} from 'react';
import PropTypes from 'prop-types';

import {superdeskApi} from '../../superdeskApi';

import {SubNav} from 'superdesk-ui-framework/react';
import {StretchBar, Spacer} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import {OrderFieldInput} from '../OrderBar';
import {DesksSubnavDropdown} from './DesksSubNavDropDown';


export const FiltersBar = ({
    filterBy,
    orderByField,
    changeSortField,
    changeFilter,
    myAssignmentsCount,
    userDesks,
    selectedDeskId,
    selectAssignmentsFrom,
    showDeskSelection,
    showAllDeskOption,
    showDeskAssignmentView,
}) => {
    const {gettext} = superdeskApi.localization;

    return (
        <SubNav zIndex={2}>
            <StretchBar>
                {!showDeskSelection ? (
                    <Fragment>
                        {showDeskAssignmentView && (
                            <Checkbox
                                label={gettext('Desk Assignments')}
                                onChange={() => changeFilter('Desk', orderByField, selectedDeskId)}
                                value={'Desk'}
                                checkedValue={filterBy}
                                type="radio"
                                labelPosition="inside"
                                tabIndex={0}
                            />
                        )}
                        <div className="element-with-badge">
                            <Checkbox
                                label={gettext('My Assignments')}
                                onChange={() => changeFilter('User', orderByField, selectedDeskId)}
                                value={'User'}
                                checkedValue={filterBy}
                                type="radio"
                                labelPosition="inside"
                                tabIndex={0}
                            />
                            <span className="badge badge--highlight" style={{zIndex: 1005}}>
                                {myAssignmentsCount}
                            </span>
                        </div>
                    </Fragment>
                ) : (
                    <DesksSubnavDropdown
                        userDesks={userDesks}
                        selectedDeskId={selectedDeskId}
                        selectAssignmentsFrom={selectAssignmentsFrom}
                        showAllDeskOption={showAllDeskOption}
                        showDeskAssignmentView={showDeskAssignmentView}
                    />
                )}
            </StretchBar>

            <Spacer />

            <div className="filter-bar__order-field">
                <OrderFieldInput
                    value={orderByField}
                    options={[
                        {id: 'Created', label: gettext('Created')},
                        {id: 'Updated', label: gettext('Updated')},
                        {id: 'Priority', label: gettext('Priority')},
                        {id: 'Scheduled', label: gettext('Scheduled')},
                    ]}
                    onChange={changeSortField}
                />
            </div>
        </SubNav>
    );
};

FiltersBar.propTypes = {
    filterBy: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    orderByField: PropTypes.string,
    changeFilter: PropTypes.func.isRequired,
    changeSortField: PropTypes.func.isRequired,
    userDesks: PropTypes.array,
    selectedDeskId: PropTypes.string,
    selectAssignmentsFrom: PropTypes.func,
    showDeskSelection: PropTypes.bool,
    showAllDeskOption: PropTypes.bool,
    showDeskAssignmentView: PropTypes.bool,
};

FiltersBar.defaultProps = {
    filterBy: 'Desk',
    myAssignmentsCount: 0,
    orderByField: 'Updated',
    userDesks: [],
    selectedDeskId: '',
    workspace: '',
    showDeskSelection: false,
    showAllDeskOption: false,
    showDeskAssignmentView: false,
};

