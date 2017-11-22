import React from 'react';
import classNames from 'classnames';

import SearchBar from './components/SearchBar';
import FiltersBar from './components/FiltersBar';
import FiltersPanel from './components/FiltersPanel';
import PreviewPanel from './components/PreviewPanel';
import MainPanel from './components/MainPanel';

import './planning.scss';

class PlanningApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            leftFilterOpen: false,
            leftPreviewOpen: false,
            activeFilter: null,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.setFilter = this.setFilter.bind(this);
    }

    toggleFilterPanel() {
        this.setState({leftFilterOpen: !this.state.leftFilterOpen});
    }

    setFilter(filter) {
        this.setState({activeFilter: filter});
    }

    render() {
        const mainClassName = classNames(
            'sd-page-content__content-block',
            'sd-page-content__content-block--main',
            {
                'open-filters': this.state.leftFilterOpen,
                'open-preview': this.state.leftPreviewOpen,
            }
        );

        return (
            <div className={mainClassName}>
                <SearchBar />
                <FiltersBar
                    filterPanelOpen={this.state.leftFilterOpen}
                    toggleFilterPanel={this.toggleFilterPanel}
                    activeFilter={this.state.activeFilter}
                    setFilter={this.setFilter}
                />
                <div className="sd-column-box--3">
                    <FiltersPanel />
                    <MainPanel />
                    <PreviewPanel />
                </div>
            </div>
        );
    }
}

export default PlanningApp;
