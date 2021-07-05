import React from 'react';
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

interface IProps {
    name?: string;
    items?: Array<any>;
    users?: Array<any>;
    desks?: Array<any>;
    onItemClick(): void;
    onDoubleClick?(): void;
    editItem?: {};
    previewItem?: string;
    lockedItems: {};
    agendas: Array<any>;
    session?: {};
    privileges?: {};
    calendars?: Array<any>;
    activeFilter?: string;
    showRelatedPlannings?(): void;
    relatedPlanningsInList?: {};
    onAddCoverageClick?(): void;
    onMultiSelectClick?(eventId, all, multi, name): void;
    selectedEventIds?: Array<any>;
    selectedPlanningIds?: Array<any>;
    itemActions?: {};
    showAddCoverage?: boolean;
    hideItemActions?: boolean;
    listFields?: {};
    activeItemIndex?: number;
    indexItems?: boolean;
    indexFrom?: number;
    navigateDown?: boolean;
    navigateList?(): void;
    onItemActivate?(): void;
    contentTypes?: Array<any>;
    contacts?: {};
    listViewType?: string;
    sortField?: string;
    listBoxGroupProps: {};
}

export class ListGroup extends React.Component<IProps> {
    private refUl: HTMLElement | null;

    constructor(props: IProps) {
        super(props);

        this.handlePreviewClose = this.handlePreviewClose.bind(this);
    }

    handlePreviewClose(event) {
        const id = event?.detail?.itemId;

        if (id == null) {
            return;
        }

        const idInGroup = this.props.items.find((item) => item._id === id) != null;

        if (idInGroup) {
            this.refUl?.focus();
        }
    }

    componentDidMount() {
        document.addEventListener('superdesk-planning.close-preview', this.handlePreviewClose);
    }

    componentWillUnmount() {
        document.removeEventListener('superdesk-planning.close-preview', this.handlePreviewClose);
    }

    render() {
        const {
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
            navigateDown,
            navigateList,
            onItemActivate,
            previewItem,
            contentTypes,
            contacts,
            listViewType,
            sortField,
            listBoxGroupProps,
        } = this.props;

        // with defaults
        const indexItems = this.props.indexItems ?? false;
        const indexFrom = this.props.indexFrom ?? 0;

        const flattenMultiday = (eventId, all, multi) => {
            onMultiSelectClick(eventId, all, multi, name);
        };
        const minTimeWidth = getMinTimeWidth(items, listViewType, sortField);

        const headingId = `heading--${listBoxGroupProps['groupId']}`;

        return (
            <div className="ListGroup">
                {name == null ? null : (
                    <Header title={moment(name).format('dddd LL')} id={headingId} />
                )}
                <Group
                    spaceBetween={listViewType === LIST_VIEW_TYPE.SCHEDULE}
                    listBoxGroupProps={listBoxGroupProps}
                    aria-labelledby={headingId}
                    indexFrom={indexFrom}
                    refNode={(el) => {
                        this.refUl = el;
                    }}
                >
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

                        const id = listBoxGroupProps.getChildId(index);
                        const selectedId = listBoxGroupProps.containerProps['aria-activedescendant'];

                        return (
                            <div
                                id={id}
                                role="option"
                                aria-selected={id === selectedId ? true : undefined}
                                key={item._id}
                            >
                                <ListGroupItem {...itemProps} />
                            </div>
                        );
                    })}
                </Group>
            </div>
        );
    }
}
