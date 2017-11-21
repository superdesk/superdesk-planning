import React from 'react';
import classNames from 'classnames';

import SearchBar from './components/SearchBar';
import FiltersBar from './components/FiltersBar';
import FiltersPanel from './components/FiltersPanel';
import PreviewPanel from './components/PreviewPanel';
import MainPanel from './components/MainPanel';

class PlanningApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            leftFilterOpen: false,
            leftPreviewOpen: false,
        };

        this.toggleFilter = this.toggleFilter.bind(this);
    }

    toggleFilter() {
        this.setState({leftFilterOpen: !this.state.leftFilterOpen});
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
                <FiltersBar leftFilterOpen={this.state.leftFilterOpen} toggleFilter={this.toggleFilter} />
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
