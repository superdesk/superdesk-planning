import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {
    SearchBar,
    FiltersBar,
    SearchPanel,
    PreviewPanel,
    Editor,
    ListPanel
} from './components/Main';

import './planning.scss';

import {main, selectAgenda} from './actions';

import * as selectors from './selectors';

class PlanningApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorOpen: false,
            filtersOpen: false,
            previewOpen: false,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.openEditor = this.openEditor.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.closePreview = this.closePreview.bind(this);
    }

    toggleFilterPanel() {
        this.setState({filtersOpen: !this.state.filtersOpen});
    }

    onItemClick(item) {
        this.props.preview(item);
        this.setState({
            previewOpen: true,
            initialLoad: !this.state.previewOpen,
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.editItem !== this.props.editItem) {
            this.setState({editorOpen: !!nextProps.editItem});
        }
    }

    openEditor(item) {
        this.setState({editorOpen: true});
        this.props.edit(item);
    }

    closeEditor() {
        this.setState({editorOpen: false});
    }

    closePreview() {
        this.setState({
            previewOpen: false,
            initialLoad: false,
        });
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
            'sd-page-content__content-block',
            'sd-page-content__content-block--right',
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
                        activeFilter={this.props.activeFilter}
                        setFilter={this.props.filter}
                        agendas={this.props.agendas}
                        selectAgenda={this.props.selectAgenda}
                        currentAgendaId={this.props.currentAgendaId}
                    />
                    <div className="sd-column-box--3">
                        <SearchPanel />
                        <ListPanel
                            groups={this.props.groups}
                            onItemClick={this.onItemClick}
                            onDoubleClick={this.openEditor}
                            lockedItems={this.props.lockedItems}
                            dateFormat={this.props.dateFormat}
                            timeFormat={this.props.timeFormat}
                            agendas={this.props.agendas}
                        />
                        <PreviewPanel
                            item={this.props.previewItem}
                            edit={this.openEditor}
                            closePreview={this.closePreview}
                            initialLoad={this.state.initialLoad}
                        />
                    </div>
                </div>
                <div className={editorClassName}>
                    <Editor
                        item={this.props.editItem}
                        cancel={this.props.cancel}
                        minimize={this.closeEditor}
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
    filter: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    activeFilter: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
    groups: selectors.main.itemGroups(state),
    editItem: state.main.editItem,
    previewItem: selectors.main.previewItem(state),
    lockedItems: selectors.getLockedItems(state),
    dateFormat: selectors.getDateFormat(state),
    timeFormat: selectors.getTimeFormat(state),
    activeFilter: selectors.main.activeFilter(state),
    agendas: selectors.getAgendas(state),
    currentAgendaId: selectors.getCurrentAgendaId(state),
});

const mapDispatchToProps = (dispatch) => ({
    edit: (item) => dispatch(main.edit(item)),
    cancel: () => dispatch(main.cancel()),
    preview: (item) => dispatch(main.preview(item)),
    filter: (filterType) => dispatch(main.filter(filterType)),
    selectAgenda: (agendaId) => dispatch(selectAgenda(agendaId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PlanningApp);
