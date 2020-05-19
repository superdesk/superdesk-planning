import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {ListGroupItem} from './';
import {Group, Header} from '../UI/List';

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
}) => {
    const flattenMultiday = (eventId, all, multi) => {
        onMultiSelectClick(eventId, all, multi, name);
    };

    return (
        <div className="ListGroup">
            <Header title={moment(name).format('dddd LL')} />
            <Group spaceBetween={true}>
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
};

ListGroup.defaultProps = {
    indexItems: false,
    indexFrom: 0,
};
