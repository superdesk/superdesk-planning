import React from 'react';

import {FILTER_TYPE} from '../../interfaces';

import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox, CalendarNavigation} from '.';

interface IProps {
    activeFilter: FILTER_TYPE;
    filterPanelOpen: boolean;
    showFilters: boolean;
    toggleFilterPanel(): void;
    setFilter(filter: FILTER_TYPE): void;
}

export class FiltersBar extends React.PureComponent<IProps> {
    render() {
        return (
            <SubNav
                zIndex={4}
                testId="subnav-filters"
            >
                <ToggleFiltersButton
                    filterPanelOpen={this.props.filterPanelOpen}
                    toggleFilterPanel={this.props.toggleFilterPanel}
                />
                <FiltersBox
                    activeFilter={this.props.activeFilter}
                    setFilter={this.props.setFilter}
                    showFilters={this.props.showFilters}
                />
                <CalendarNavigation />
            </SubNav>
        );
    }
}
