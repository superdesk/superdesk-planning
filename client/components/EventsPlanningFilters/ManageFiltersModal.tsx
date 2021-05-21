import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {ISearchFilter, IEventsPlanningContentPanelProps} from '../../interfaces';

import {Modal} from '../index';
import {MODALS, PRIVILEGES, KEYCODES} from '../../constants';
import {SubNav, StretchBar, Button} from '../UI/SubNav';
import {ColumnBox} from '../UI';
import {SidePanel} from '../UI/SidePanel';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {FiltersList} from './FiltersList';
import {EditFilter} from './EditFilter';
import {PreviewFilter} from './PreviewFilter';
import {EditFilterSchedule} from './EditFilterSchedule';

interface IProps {
    handleHide(): void;
    privileges: {[key: string]: number};
    deleteFilter(filter: ISearchFilter): void;
    deleteFilterSchedule(filter: ISearchFilter): void;
    createOrUpdate(filter: Partial<ISearchFilter>): Promise<void>;
}

interface IState {
    selectedFilter?: Partial<ISearchFilter>;
    contentPanelState: null | 'preview' | 'edit' | 'schedule';
}

const mapStateToProps = (state) => ({
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    deleteFilter: (filter) => {
        const {gettext} = superdeskApi.localization;

        dispatch(actions.showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext('Do you want to delete "{{ name }}" filter?', {name: filter.name}),
                action: () => dispatch(actions.eventsPlanning.ui.deleteFilter(filter)),
                autoClose: true,
            },
        }));
    },
    deleteFilterSchedule: (filter) => {
        const {gettext} = superdeskApi.localization;

        dispatch(actions.showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext('Are you sure you want to delete this schedule?'),
                action: () => dispatch(actions.eventsPlanning.ui.saveFilter({
                    ...filter,
                    schedules: [],
                })),
                autoClose: true,
            },
        }));
    },
    createOrUpdate: (filter) => dispatch(actions.eventsPlanning.ui.saveFilter(filter)),
});


export class ManageFiltersComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedFilter: null,
            contentPanelState: null,
        };

        this.editFilter = this.editFilter.bind(this);
        this.previewFilter = this.previewFilter.bind(this);
        this.editFilterSchedule = this.editFilterSchedule.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.handleHide();
        }
    }

    editFilter(filter: Partial<ISearchFilter> = null) {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'edit',
        });
    }

    previewFilter(filter: ISearchFilter) {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'preview',
        });
    }

    editFilterSchedule(filter: ISearchFilter) {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'schedule',
        });
    }

    closeEditor() {
        this.setState({
            selectedFilter: null,
            contentPanelState: null,
        });
    }

    getContentPanelComponent(): React.ComponentType<IEventsPlanningContentPanelProps> | null {
        switch (this.state.contentPanelState) {
        case 'edit':
            return EditFilter;
        case 'preview':
            return PreviewFilter;
        case 'schedule':
            return EditFilterSchedule;
        }

        return null;
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {handleHide, privileges, deleteFilter, createOrUpdate} = this.props;

        const rightPanelClasses = this.state.contentPanelState != null ?
            'sd-main-content-grid__preview open-preview' :
            'sd-main-content-grid__preview';
        const ContentPanel = this.getContentPanelComponent();

        return (
            <Modal
                xLarge={true}
                show={true}
                onHide={handleHide}
            >
                <Modal.Header>
                    <h3 className="modal__heading">
                        {gettext('Manage Events & Planning Filters')}
                    </h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body
                    noPadding={true}
                    noScroll={true}
                >
                    <div
                        style={{height: '100%'}}
                        className="sd-content-wrapper__main-content-area sd-main-content-grid comfort"
                    >
                        <div className="sd-main-content-grid__content">
                            {!!privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] && (
                                <SubNav>
                                    <StretchBar />
                                    <Button
                                        right={true}
                                        buttonClassName="btn btn--primary"
                                        onClick={() => this.editFilter()}
                                        testId="manage-filters--add-new-filter"
                                    >
                                        <i className="icon-plus-sign icon-white" />
                                        {gettext('Add New Filter')}
                                    </Button>
                                </SubNav>
                            )}
                            <ColumnBox.Box verticalScroll={true}>
                                <ColumnBox.MainColumn padded={true}>
                                    <FiltersList
                                        privileges={privileges}
                                        deleteFilter={deleteFilter}
                                        editFilter={this.state.contentPanelState === 'edit' ? null : this.editFilter}
                                        editFilterSchedule={this.editFilterSchedule}
                                        deleteFilterSchedule={this.props.deleteFilterSchedule}
                                        previewFilter={this.previewFilter}
                                    />
                                </ColumnBox.MainColumn>
                            </ColumnBox.Box>
                        </div>
                        <div className={rightPanelClasses} data-test-id="manage-filters--content-panel">
                            <div className="side-panel__container">
                                <SidePanel className="side-panel--right">
                                    {ContentPanel == null ? (
                                        <div />
                                    ) : (
                                        <ContentPanel
                                            filter={this.state.selectedFilter}
                                            onClose={this.closeEditor}
                                            onSave={createOrUpdate}
                                            editFilter={this.editFilter}
                                            editFilterSchedule={this.editFilterSchedule}
                                            previewFilter={this.previewFilter}
                                            deleteFilterSchedule={this.props.deleteFilterSchedule}
                                        />
                                    )}
                                </SidePanel>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

export const ManageFiltersModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageFiltersComponent);
