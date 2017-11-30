import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

import SearchBar from './components/SearchBar';
import FiltersBar from './components/FiltersBar';
import FiltersPanel from './components/FiltersPanel';
import PreviewPanel from './components/PreviewPanel';
import MainPanel from './components/MainPanel';
import Editor from './components/Editor';

import './planning.scss';

import {
    edit,
    cancel,
    preview,
} from './actions/main';

import * as selectors from './selectors';

class PlanningApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorOpen: false,
            filtersOpen: false,
            previewOpen: false,
            activeFilter: null,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.edit = this.edit.bind(this);
    }

    toggleFilterPanel() {
        this.setState({filtersOpen: !this.state.filtersOpen});
    }

    setFilter(filter) {
        this.setState({activeFilter: filter});
    }

    onItemClick(item) {
        if (item === this.props.previewItem) {
            this.setState({previewOpen: !this.state.previewOpen});
        } else {
            this.props.preview(item);
            this.setState({previewOpen: true});
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.editItem !== this.props.editItem) {
            this.setState({editorOpen: !!nextProps.editItem});
        }
    }

    edit(item) {
        this.setState({editorOpen: true});
        this.props.edit(item);
    }

    render() {
        const sectionClassName = classNames(
            'sd-content sd-page-content--slide-in',
            {
                'sd-page-content--slide-in--open': this.state.editorOpen,
            }
        );

        const contentBlockFlags = {
            'open-filters': this.state.filtersOpen,
            'open-preview': this.state.previewOpen,
        };

        const mainClassName = classNames(
            'sd-page-content__content-block',
            'sd-page-content__content-block--main',
            contentBlockFlags
        );

        const editorClassName = classNames(
            'sd-edit-panel',
            'sd-page-content__content_block',
            'sd-page-content__content_block--right',
            'sd-page-content__content-block--30-slide',
            contentBlockFlags
        );

        return (
            <section className={sectionClassName}>
                <div className={mainClassName}>
                    <SearchBar />
                    <FiltersBar
                        filterPanelOpen={this.state.filtersOpen}
                        toggleFilterPanel={this.toggleFilterPanel}
                        activeFilter={this.state.activeFilter}
                        setFilter={this.setFilter}
                    />
                    <div className="sd-column-box--3">
                        <FiltersPanel />
                        <MainPanel
                            groups={this.props.groups}
                            onItemClick={this.onItemClick}
                        />
                        <PreviewPanel
                            item={this.props.previewItem}
                            edit={this.edit}
                            closePreview={() => this.setState({previewOpen: false})}
                        />
                    </div>
                </div>
                <div className={editorClassName}>
                    <Editor
                        item={this.props.editItem}
                        cancel={(item) => this.props.cancel(item)}
                        minimize={() => this.setState({editorOpen: false})}
                    />
                </div>
            </section>
        );
    }
}

PlanningApp.propTypes = {
    groups: PropTypes.array,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    edit: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    preview: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
    groups: selectors.getEventsOrderedByDay(state),
    editItem: state.main.editItem,
    previewItem: state.main.previewItem,
});

const mapDispatchToProps = {
    edit,
    cancel,
    preview,
};

export default connect(mapStateToProps, mapDispatchToProps)(PlanningApp);
