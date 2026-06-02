import * as React from 'react';
import {connect} from 'react-redux';

import {IArticle} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {GROUP_LIST_BY, IPlanningAppState, IMainViewType, PLANNING_VIEW} from '../../interfaces';
import {ISubNavPanelProps} from '../PageContent';

import {ITEM_TYPE} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ButtonGroup, Dropdown, NavButton, SubNav, Switch} from 'superdesk-ui-framework/react';
import {ArchiveItem} from '../../components/Archive';
import {MultiSelectActions} from '../../components';
import {Button, SearchBox} from '../../components/UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown, FiltersBox} from '../../components/Main';
import {appConfig} from 'appConfig';

interface IProps extends ISubNavPanelProps {
    withArchiveItem?: boolean;
    hideOpenCoverageAction?: boolean;
    archiveItem?: IArticle
    fullText?: string;
    currentView?: PLANNING_VIEW;
    isViewFiltered: boolean;
    createPlanningOnly?: boolean;
    privileges: {[key: string]: number};
    showFilters?: boolean; // defaults to true
    groupListBy: GROUP_LIST_BY;
    viewType: IMainViewType;

    addEvent(): void;
    addPlanning(): void;
    openAgendas(): void;
    openEventsPlanningFiltersModal(): void;
    openFeaturedPlanningModal(): void;
}

const mapStateToProps = (state: IPlanningAppState) => ({
    fullText: selectors.main.fullText(state),
    currentView: selectors.main.activeFilter(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    privileges: selectors.general.privileges(state),
    groupListBy: selectors.main.getCurrentListGrouping(state),
    viewType: state.main.viewType,
});

const mapDispatchToProps = (dispatch) => ({
    addEvent: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT)),
    addPlanning: () => dispatch(actions.main.createNew(ITEM_TYPE.PLANNING)),
    openAgendas: () => dispatch(actions.openAgenda()),
    openEventsPlanningFiltersModal: () => dispatch(actions.eventsPlanning.ui.openFilters()),
    openFeaturedPlanningModal: () => dispatch(actions.planning.featuredPlanning.openFeaturedPlanningModal()),
});

const iconByViewType: {[key in IMainViewType]: string} = {
    list: 'list-view',
    'list-compact': 'unordered-list',
};

export class PlanningSubNavComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.search = this.search.bind(this);
    }

    search(searchText) {
        planningApi.ui.list.search({full_text: searchText});
    }

    render() {
        const {gettext} = superdeskApi.localization;

        const viewType = this.props.viewType ?? 'list';

        const viewOptions: Array<{label: string, onSelect(): void, icon: string}> = [{
            label: gettext('List'),
            onSelect: () => planningApi.ui.list.setViewType('list'),
            icon: iconByViewType['list'],
        }];

        const compactViewAvailable: boolean = (() => {
            const compactPlanningsConfigured = appConfig.planning?.planning_list_item?.compact_view != null;
            const compactEventsConfigured = appConfig.planning?.event_list_item?.compact_view != null;

            if (this.props.currentView == null) {
                return false;
            } else if (this.props.currentView === PLANNING_VIEW.PLANNING) {
                return compactPlanningsConfigured;
            } else if (this.props.currentView === PLANNING_VIEW.EVENTS) {
                return compactEventsConfigured;
            } else if (this.props.currentView === PLANNING_VIEW.COMBINED) {
                return compactPlanningsConfigured || compactEventsConfigured;
            } else {
                return superdeskApi.helpers.assertNever(this.props.currentView);
            }
        })();

        if (compactViewAvailable) {
            viewOptions.push({
                label: gettext('Compact list'),
                onSelect: () => planningApi.ui.list.setViewType('list-compact'),
                icon: iconByViewType['list-compact'],
            });
        }

        return (
            <React.Fragment>
                {this.props.withArchiveItem !== true ? null : (
                    <ArchiveItem
                        item={this.props.archiveItem}
                        hideOpenCoverageAction={this.props.hideOpenCoverageAction}
                    />
                )}
                <SubNav>
                    <MultiSelectActions />
                    <SearchBox
                        label={gettext('Search planning')}
                        value={this.props.fullText}
                        search={this.search}
                        activeFilter={this.props.currentView}
                    />
                    {(this.props.fullText || this.props.isViewFiltered) && (
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
                <SubNav>
                    <ButtonGroup align="inline">
                        <NavButton
                            icon="filter-large"
                            onClick={this.props.toggleFilterPanel}
                            text={gettext('Toggle advanced Filters')}
                            type={this.props.filtersOpen === true ?
                                'primary' :
                                'default'
                            }
                        />
                    </ButtonGroup>
                    <FiltersBox
                        showFilters={this.props.showFilters ?? true}
                        privileges={this.props.privileges}
                    />
                    <ButtonGroup align="end">
                        <Switch
                            label={{content: gettext('Group by day'), side: 'left'}}
                            value={this.props.groupListBy === GROUP_LIST_BY.DATE}
                            onChange={(val) => {
                                const nextView = val === true ? GROUP_LIST_BY.DATE : GROUP_LIST_BY.NOT_GROUPED;

                                planningApi.ui.list.setGroupListBy(nextView);
                            }}
                        />

                        {
                            viewOptions.length > 1 && (
                                <Dropdown items={viewOptions}>
                                    <button className="sd-navbtn" aria-label={gettext('Change view')}>
                                        <i className={'icon-' + iconByViewType[viewType]} />
                                    </button>
                                </Dropdown>
                            )
                        }

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
