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
import {ModalsContainer} from './components';

import './planning.scss';

import * as actions from './actions';
import * as selectors from './selectors';
import {EVENTS, PLANNING, ITEM_TYPE} from './constants';

class PlanningApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersOpen: false,
            previewOpen: false,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.addEvent = this.addEvent.bind(this);
        this.addPlanning = this.addPlanning.bind(this);
        this.onSave = this.onSave.bind(this);
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

    closePreview() {
        this.setState({
            previewOpen: false,
            initialLoad: false,
        });

        this.props.closePreview();
    }

    addEvent() {
        this.props.edit({_type: ITEM_TYPE.EVENT});
    }

    addPlanning() {
        this.props.edit({_type: ITEM_TYPE.PLANNING});
    }

    onSave(item, save = true, publish = false) {
        return this.props.onSave(item, save, publish);
    }

    render() {
        const sectionClassName = classNames(
            'sd-content sd-page-content--slide-in',
            {'sd-page-content--slide-in--open': !!this.props.editItemType}
        );

        const contentBlockFlags = {
            'open-filters': this.state.filtersOpen,
            'open-preview': this.state.previewOpen && !!this.props.previewItem,
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

        const listPanelProps = {
            groups: this.props.groups,
            onItemClick: this.onItemClick,
            onDoubleClick: this.props.edit,
            agendas: this.props.agendas,
            lockedItems: this.props.lockedItems,
            dateFormat: this.props.dateFormat,
            timeFormat: this.props.timeFormat,
            session: this.props.session,
            privileges: this.props.privileges,
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
        };

        return (
            <section className={sectionClassName}>
                <div className={mainClassName}>
                    <SearchBar
                        addEvent={this.addEvent}
                        addPlanning={this.addPlanning}
                        openAgendas={this.props.openAgendas}
                    />
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
                        <ListPanel { ...listPanelProps } />
                        <PreviewPanel
                            item={this.props.previewItem}
                            edit={this.props.edit}
                            closePreview={this.closePreview}
                            initialLoad={this.state.initialLoad}
                        />
                    </div>
                </div>
                <div className={editorClassName}>
                    <Editor
                        item={this.props.editItem}
                        itemType={this.props.editItemType}
                        cancel={this.props.cancel.bind(null, this.props.editItem)}
                        minimize={this.props.cancel.bind(null, this.props.editItem)}
                        onSave={this.onSave}
                        onUnpublish={this.props.onUnpublish}
                        session={this.props.session}
                        privileges={this.props.privileges}
                        lockedItems={this.props.lockedItems}
                        openCancelModal={this.props.openCancelModal}
                    />
                </div>

                <ModalsContainer />
            </section>
        );
    }
}

PlanningApp.propTypes = {
    groups: PropTypes.array,
    editItem: PropTypes.object,
    editItemType: PropTypes.string,
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
    session: PropTypes.object,
    privileges: PropTypes.object,
    openAgendas: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,

    onSave: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
    openCancelModal: PropTypes.func.isRequired,
    closePreview: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
    groups: selectors.main.itemGroups(state),
    editItem: selectors.forms.currentItem(state),
    editItemType: selectors.forms.currentItemType(state),
    previewItem: selectors.main.previewItem(state),
    lockedItems: selectors.getLockedItems(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    activeFilter: selectors.main.activeFilter(state),
    agendas: selectors.getAgendas(state),
    currentAgendaId: selectors.getCurrentAgendaId(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    edit: (item) => dispatch(actions.main.lockAndEdit(item)),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    preview: (item) => dispatch(actions.main.preview(item)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),
    selectAgenda: (agendaId) => dispatch(actions.selectAgenda(agendaId)),
    openAgendas: () => dispatch(actions.openAgenda()),
    onSave: (item, save = true, publish = false) => dispatch(actions.main.save(item, save, publish)),
    onUnpublish: (item) => dispatch(actions.main.unpublish(item)),
    openCancelModal: (props) => dispatch(actions.main.openConfirmationModal(props)),
    closePreview: () => dispatch(actions.main.closePreview()),

    // Event Item actions:
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: (event) => dispatch(actions.duplicateEvent(event)),
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: (event) => dispatch(actions.events.ui.updateTime(event)),
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
        (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
    // Planning Item actions
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
        (planning) => (dispatch(actions.planning.ui.duplicate(planning))),
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.spike(planning))),
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.unspike(planning))),
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelPlanningModal(planning)),
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelAllCoverageModal(planning)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PlanningApp);
