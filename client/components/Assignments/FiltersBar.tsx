import React, {Fragment} from 'react';
import {format} from 'date-fns';
import {superdeskApi} from '../../superdeskApi';
import {DatePicker, SubNav, Tooltip, NavButton, ButtonGroup} from 'superdesk-ui-framework/react';
import {StretchBar, Spacer} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import {OrderFieldInput} from '../OrderBar';
import {DesksSubnavDropdown} from './DesksSubNavDropDown';
import {appConfig} from 'superdesk-core/scripts/appConfig';

interface IProps {
    filterBy?: string;
    myAssignmentsCount?: number;
    orderByField?: string;
    dayField?: string;
    changeDayField: (value: string | null) => any;
    changeFilter: (field: string, value: any, deskId: string) => void;
    changeSortField: (...args: any) => any;
    userDesks?: Array<any>;
    selectedDeskId?: string;
    selectAssignmentsFrom?: (...args: any) => void;
    showDeskSelection?: boolean;
    showAllDeskOption?: boolean;
    showDeskAssignmentView?: boolean;
    filtersOpen: boolean;
    toggleFilterPanel(): void;
}

export const FiltersBar = ({
    filterBy = 'Desk',
    orderByField = 'Updated',
    dayField,
    changeSortField,
    changeFilter,
    changeDayField,
    myAssignmentsCount = 0,
    userDesks = [],
    selectedDeskId = '',
    selectAssignmentsFrom,
    showDeskSelection = false,
    showAllDeskOption = false,
    showDeskAssignmentView = false,
    filtersOpen = false,
    toggleFilterPanel,
}: IProps) => {
    const {gettext} = superdeskApi.localization;

    return (
        <SubNav>
            <ButtonGroup align="inline">
                <NavButton
                    icon="filter-large"
                    onClick={toggleFilterPanel}
                    text={gettext('Toggle advanced Filters')}
                    type={filtersOpen ? 'primary' : 'default'}
                />
            </ButtonGroup>
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
                            <Tooltip text={gettext('Number of assignments in TO DO')} appendToBody>
                                <span className="badge badge--highlight" style={{zIndex: 1005}}>
                                    {myAssignmentsCount}
                                </span>
                            </Tooltip>
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
            <DatePicker
                headerButtonBar={[
                    {days: 0, label: gettext('Today')},
                    {days: 1, label: gettext('Tomorrow')},
                    {days: 2, label: gettext('In 2 days')},
                ]}
                fullWidth={false}
                locale={{
                    type: 'full',
                    payload: superdeskApi.ui.framework.getLocaleForDatePicker(),
                }}
                label={gettext('Filter by day:')}
                inlineLabel
                value={dayField != null ? new Date(dayField) : null}
                onChange={(val) => {
                    if (val == null) {
                        changeDayField(null);
                    } else {
                        changeDayField(format(val, 'yyyy-MM-dd'));
                    }
                }}
                dateFormat={appConfig.view.dateformat}
                data-test-id="date-input"
            />
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
