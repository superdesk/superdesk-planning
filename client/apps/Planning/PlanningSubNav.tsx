import * as React from 'react';
import {connect} from 'react-redux';

import {IArticle} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {LIST_VIEW_TYPE, PLANNING_VIEW} from '../../interfaces';
import {ISubNavPanelProps} from '../PageContent';

import {ITEM_TYPE} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ButtonGroup, Dropdown, NavButton, SubNav} from 'superdesk-ui-framework/react';
import {ArchiveItem} from '../../components/Archive';
import {MultiSelectActions} from '../../components';
import {Button, SearchBox} from '../../components/UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown, FiltersBox} from '../../components/Main';

interface IProps extends ISubNavPanelProps {
    withArchiveItem?: boolean;
    archiveItem?: IArticle
    fullText?: string;
    currentView?: PLANNING_VIEW;
    isViewFiltered: boolean;
    createPlanningOnly?: boolean;
    privileges: {[key: string]: number};
    showFilters?: boolean; // defaults to true
    listViewType: LIST_VIEW_TYPE;

    addEvent(): void;
    addPlanning(): void;
    openAgendas(): void;
    openEventsPlanningFiltersModal(): void;
    openFeaturedPlanningModal(): void;
}

const mapStateToProps = (state) => ({
    fullText: selectors.main.fullText(state),
    currentView: selectors.main.activeFilter(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    privileges: selectors.general.privileges(state),
    listViewType: selectors.main.getCurrentListViewType(state),
});

const mapDispatchToProps = (dispatch) => ({
    addEvent: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT)),
    addPlanning: () => dispatch(actions.main.createNew(ITEM_TYPE.PLANNING)),
    openAgendas: () => dispatch(actions.openAgenda()),
    openEventsPlanningFiltersModal: () => dispatch(actions.eventsPlanning.ui.openFilters()),
    openFeaturedPlanningModal: () => dispatch(actions.planning.featuredPlanning.openFeaturedPlanningModal()),
});

export class PlanningSubNavComponent extends React.PureComponent<IProps> {
    viewOptions: Array<{label: string, onSelect(): void, icon: string}>

    constructor(props) {
        super(props);

        this.search = this.search.bind(this);

        const {gettext} = superdeskApi.localization;

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

    render() {
        const {gettext} = superdeskApi.localization;
        const listViewIcon = this.props.listViewType === LIST_VIEW_TYPE.SCHEDULE ?
            'icon-list-view' :
            'icon-stream';

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
                            text={gettext('Toggle advanced Filters')}
                            type={this.props.filtersOpen === true ?
                                'primary' :
                                'default'
                            }
                        />
                    </ButtonGroup>
                    <FiltersBox showFilters={this.props.showFilters ?? true} />
                    <ButtonGroup align="right">
                        <Dropdown items={this.viewOptions}>
                            <button className="sd-navbtn" aria-label={gettext('Change view')}>
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
