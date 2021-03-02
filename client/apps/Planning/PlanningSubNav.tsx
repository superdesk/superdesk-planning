import * as React from 'react';
import {connect} from 'react-redux';

import {IArticle} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {FILTER_TYPE, LIST_VIEW_TYPE, SORT_FIELD, SORT_ORDER} from '../../interfaces';
import {ISubNavPanelProps} from '../PageContent';

import {ITEM_TYPE} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ButtonGroup, Dropdown, IconButton, NavButton, SubNav, Tooltip} from 'superdesk-ui-framework/react';
import {ArchiveItem} from '../../components/Archive';
import {MultiSelectActions} from '../../components';
import {Button, SearchBox} from '../../components/UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown, FiltersBox} from '../../components/Main';

interface IProps extends ISubNavPanelProps {
    withArchiveItem?: boolean;
    archiveItem?: IArticle
    fullText?: string;
    currentView?: FILTER_TYPE;
    isViewFiltered: boolean;
    createPlanningOnly?: boolean;
    privileges: {[key: string]: number};
    showFilters?: boolean; // defaults to true
    sortOrder: SORT_ORDER;
    sortField: SORT_FIELD;
    listViewType: LIST_VIEW_TYPE;

    addEvent(): void;
    addPlanning(): void;
    setFilter(view: FILTER_TYPE): void;
    openAgendas(): void;
    openEventsPlanningFiltersModal(): void;
    openFeaturedPlanningModal(): void;
}

const mapStateToProps = (state) => ({
    fullText: selectors.main.fullText(state),
    currentView: selectors.main.activeFilter(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    privileges: selectors.general.privileges(state),
    sortOrder: selectors.main.getCurrentSortOrder(state),
    sortField: selectors.main.getCurrentSortField(state),
    listViewType: selectors.main.getCurrentListViewType(state),
});

const mapDispatchToProps = (dispatch) => ({
    addEvent: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT)),
    addPlanning: () => dispatch(actions.main.createNew(ITEM_TYPE.PLANNING)),
    setFilter: (view) => dispatch(actions.main.filter(view)),
    openAgendas: () => dispatch(actions.openAgenda()),
    openEventsPlanningFiltersModal: () => dispatch(actions.eventsPlanning.ui.openFilters()),
    openFeaturedPlanningModal: () => dispatch(actions.planning.featuredPlanning.openFeaturedPlanningModal()),
});

export class PlanningSubNavComponent extends React.PureComponent<IProps> {
    sortFieldOptions: Array<{label: string, onSelect(): void}>
    viewOptions: Array<{label: string, onSelect(): void, icon: string}>

    constructor(props) {
        super(props);

        this.search = this.search.bind(this);
        this.toggleSortOrder = this.toggleSortOrder.bind(this);

        const {gettext} = superdeskApi.localization;

        this.sortFieldOptions = [{
            label: gettext('Schedule'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.SCHEDULE),
        }, {
            label: gettext('Created'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.CREATED),
        }, {
            label: gettext('Updated'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.UPDATED),
        }];

        this.viewOptions = [{
            label: gettext('Schedule'),
            onSelect: () => planningApi.ui.list.setViewType(LIST_VIEW_TYPE.SCHEDULE),
            icon: 'list-view',
        }, {
            label: gettext('List'),
            onSelect: () => planningApi.ui.list.setViewType(LIST_VIEW_TYPE.LIST),
            icon: 'stream',
        }];
    }

    search(searchText) {
        planningApi.ui.list.search({full_text: searchText});
    }

    toggleSortOrder() {
        planningApi.ui.list.search({
            sort_order: this.props.sortOrder === SORT_ORDER.ASCENDING ?
                SORT_ORDER.DESCENDING :
                SORT_ORDER.ASCENDING,
        });
    }

    changeSortField(field: SORT_FIELD) {
        planningApi.ui.list.search({sort_field: field});
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const iconTooltipText = this.props.sortOrder === SORT_ORDER.ASCENDING ?
            gettext('Ascending') :
            gettext('Descending');
        const listViewIcon = this.props.listViewType === LIST_VIEW_TYPE.SCHEDULE ?
            'icon-list-view' :
            'icon-stream';
        let dropdownText: string;

        switch (this.props.sortField) {
        case SORT_FIELD.SCHEDULE:
            dropdownText = gettext('Schedule');
            break;
        case SORT_FIELD.CREATED:
            dropdownText = gettext('Created');
            break;
        case SORT_FIELD.UPDATED:
            dropdownText = gettext('Updated');
            break;
        }

        return (
            <React.Fragment>
                {this.props.withArchiveItem !== true ? null : (
                    <ArchiveItem item={this.props.archiveItem} />
                )}
                <SubNav zIndex={3}>
                    <MultiSelectActions />
                    <SearchBox
                        label={gettext('Search planning')}
                        value={this.props.fullText}
                        search={this.search}
                        activeFilter={this.props.currentView}
                    />
                    {!this.props.isViewFiltered ? null : (
                        <Button
                            text={gettext('Clear Filters')}
                            className="btn__clear-filters"
                            hollow={true}
                            color="alert"
                            onClick={planningApi.ui.list.clearSearch}
                        />
                    )}
                    <CreateNewSubnavDropdown
                        addEvent={this.props.addEvent}
                        addPlanning={this.props.addPlanning}
                        createPlanningOnly={this.props.createPlanningOnly}
                        privileges={this.props.privileges}
                    />
                </SubNav>
                <SubNav zIndex={2}>
                    <ButtonGroup align="inline">
                        <NavButton
                            icon="filter-large"
                            onClick={this.props.toggleFilterPanel}
                            type={this.props.filtersOpen === true ?
                                'primary' :
                                'default'
                            }
                        />
                    </ButtonGroup>
                    <FiltersBox
                        activeFilter={this.props.currentView}
                        setFilter={this.props.setFilter}
                        showFilters={this.props.showFilters ?? true}
                    />
                    <ButtonGroup align="right">
                        {this.props.listViewType === LIST_VIEW_TYPE.SCHEDULE ? null : (
                            <div className="subnav__content-bar">
                                <Dropdown items={this.sortFieldOptions}>
                                    <span className="sd-margin-r--1">
                                        <span className="sd-text__normal">
                                            {gettext('Sort by:')}
                                        </span>
                                        &nbsp;
                                        <span className="sd-text__strong">
                                            {dropdownText}
                                        </span>
                                        <span className="dropdown__caret" />
                                    </span>
                                </Dropdown>
                                <Tooltip
                                    key={iconTooltipText}
                                    text={iconTooltipText}
                                    flow="down"
                                >
                                    <IconButton
                                        ariaValue={iconTooltipText}
                                        onClick={this.toggleSortOrder}
                                        icon={this.props.sortOrder ?? SORT_ORDER.ASCENDING}
                                    />
                                </Tooltip>
                            </div>
                        )}
                        <Dropdown items={this.viewOptions}>
                            <button className="sd-navbtn">
                                <i className={listViewIcon} />
                            </button>
                        </Dropdown>
                        <ActionsSubnavDropdown
                            openAgendas={this.props.openAgendas}
                            openEventsPlanningFiltersModal={this.props.openEventsPlanningFiltersModal}
                            openFeaturedPlanningModal={this.props.openFeaturedPlanningModal}
                            privileges={this.props.privileges}
                        />
                    </ButtonGroup>
                </SubNav>
            </React.Fragment>
        );
    }
}

export const PlanningSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningSubNavComponent);
