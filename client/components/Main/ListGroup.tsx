import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {ListGroupItem} from './';
import {Group, Header} from '../UI/List';
import {IEventOrPlanningItem, LIST_VIEW_TYPE, SORT_FIELD} from '../../interfaces';
import {timeUtils} from '../../utils';

const TIME_COLUMN_MIN_WIDTH = {
    WITH_YEAR: '11rem',
    WITH_DATE: '8.5rem',
    TIME_ONLY: undefined,
};

function getMinTimeWidth(
    items: Array<IEventOrPlanningItem>,
    listViewType: LIST_VIEW_TYPE,
    sortField: SORT_FIELD
): string | undefined {
    if (listViewType === LIST_VIEW_TYPE.SCHEDULE) {
        return TIME_COLUMN_MIN_WIDTH.TIME_ONLY;
    }

    const field: keyof IEventOrPlanningItem = sortField === SORT_FIELD.CREATED ?
        'firstcreated' :
        'versioncreated';
    const timezone = timeUtils.localTimeZone();
    const localNow = moment.tz(timezone);
    let isTodayOnly = true;

    for (let i = 0; i < items.length; i++) {
        const localDate = moment.tz(items[i][field], timezone);

        if (!localDate.isSame(localNow, 'year')) {
            return TIME_COLUMN_MIN_WIDTH.WITH_YEAR;
        } else if (!localDate.isSame(localNow, 'day')) {
            isTodayOnly = false;
        }
    }

    return isTodayOnly ?
        TIME_COLUMN_MIN_WIDTH.TIME_ONLY :
        TIME_COLUMN_MIN_WIDTH.WITH_DATE;
}

export const ListGroup = ({
    name,
    items,
    lockedItems,
    agendas,
    session,
    privileges,
    calendars,
    activeFilter,
    showRelatedPlannings,
    relatedPlanningsInList,
    onItemClick,
    onDoubleClick,
    onAddCoverageClick,
    onMultiSelectClick,
    selectedEventIds,
    selectedPlanningIds,
    itemActions,
    users,
    desks,
    showAddCoverage,
    hideItemActions,
    listFields,
    activeItemIndex,
    indexItems,
    indexFrom,
    navigateDown,
    navigateList,
    onItemActivate,
    previewItem,
    contentTypes,
    contacts,
    listViewType,
    sortField,
}) => {
    const flattenMultiday = (eventId, all, multi) => {
        onMultiSelectClick(eventId, all, multi, name);
    };
    const minTimeWidth = getMinTimeWidth(items, listViewType, sortField);

    return (
        <div className="ListGroup">
            {name == null ? null : (
                <Header title={moment(name).format('dddd LL')} />
            )}
            <Group spaceBetween={listViewType === LIST_VIEW_TYPE.SCHEDULE}>
                {items.map((item, index) => {
                    let itemProps = {
                        date: name,
                        item: item,
                        onItemClick: onItemClick,
                        onDoubleClick: onDoubleClick,
                        onAddCoverageClick: onAddCoverageClick.bind(null, item),
                        lockedItems: lockedItems,
                        agendas: agendas,
                        session: session,
                        privileges: privileges,
                        activeFilter: activeFilter,
                        showRelatedPlannings: showRelatedPlannings,
                        relatedPlanningsInList: relatedPlanningsInList,
                        onMultiSelectClick: flattenMultiday,
                        selectedEventIds: selectedEventIds,
                        selectedPlanningIds: selectedPlanningIds,
                        itemActions: itemActions,
                        users: users,
                        desks: desks,
                        showAddCoverage: showAddCoverage,
                        hideItemActions: hideItemActions,
                        calendars: calendars,
                        listFields: listFields,
                        navigateDown: navigateDown,
                        navigateList: navigateList,
                        onItemActivate: onItemActivate,
                        previewItem: previewItem,
                        contentTypes: contentTypes,
                        contacts: contacts,
                        listViewType: listViewType,
                        sortField: sortField,
                        minTimeWidth: minTimeWidth,
                    };

                    if (indexItems) {
                        itemProps.index = indexFrom + index;
                        itemProps.active = (activeItemIndex === itemProps.index);
                    }

                    return (<ListGroupItem key={item._id} {...itemProps} />);
                })}
            </Group>
        </div>
    );
};

ListGroup.propTypes = {
    name: PropTypes.string,
    items: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.string,
    lockedItems: PropTypes.object.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    calendars: PropTypes.array,
    activeFilter: PropTypes.string,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    itemActions: PropTypes.object,
    showAddCoverage: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    listFields: PropTypes.object,
    activeItemIndex: PropTypes.number,
    indexItems: PropTypes.bool,
    indexFrom: PropTypes.number,
    navigateDown: PropTypes.bool,
    navigateList: PropTypes.func,
    onItemActivate: PropTypes.func,
    contentTypes: PropTypes.array,
    contacts: PropTypes.object,
    listViewType: PropTypes.string,
    sortField: PropTypes.string,
};

ListGroup.defaultProps = {
    indexItems: false,
    indexFrom: 0,
};
