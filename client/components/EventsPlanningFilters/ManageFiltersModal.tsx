import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {ISearchFilter, IEventsPlanningContentPanelProps} from '../../interfaces';

import {PRIVILEGES, KEYCODES} from '../../constants';
import {ColumnBox} from '../UI';
import {SidePanel} from '../UI/SidePanel';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {FiltersList} from './FiltersList';
import {EditFilter} from './EditFilter';
import {PreviewFilter} from './PreviewFilter';
import {EditFilterSchedule} from './EditFilterSchedule';
import {Button, Modal, SubNav, ButtonGroup} from 'superdesk-ui-framework/react';

interface IProps {
    handleHide(): void;
    privileges: {[key: string]: number};
    createOrUpdate(filter: Partial<ISearchFilter>): Promise<void>;
    deleteFilter(filter: ISearchFilter): Promise<void>;
    deleteFilterSchedule(filter: ISearchFilter): Promise<void>;
}

interface IState {
    selectedFilter?: Partial<ISearchFilter>;
    contentPanelState: null | 'preview' | 'edit' | 'schedule';
    isPristine: boolean;
    pendingFilter?: Partial<ISearchFilter>;
}

const mapStateToProps = (state) => ({
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    createOrUpdate: (filter) => dispatch(actions.eventsPlanning.ui.saveFilter(filter)),
    deleteFilter: (filter) => dispatch(actions.eventsPlanning.ui.deleteFilter(filter)),
    deleteFilterSchedule: (filter) => dispatch(actions.eventsPlanning.ui.saveFilter({
        ...filter,
        schedules: [],
    })),
});

class ManageFiltersComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedFilter: null,
            contentPanelState: null,
            isPristine: true,
            pendingFilter: null,
        };

        this.deleteFilter = this.deleteFilter.bind(this);
        this.deleteFilterSchedule = this.deleteFilterSchedule.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    deleteFilter(filter: ISearchFilter) {
        const {gettext} = superdeskApi.localization;
        const {confirm} = superdeskApi.ui;

        confirm(
            gettext('Filter "{{ name }}" will be permanently deleted.', {name: filter.name}),
            gettext('Delete Item?')
        ).then((confirmed) => {
            if (confirmed) {
                this.props.deleteFilter(filter);
            }
        });
    }

    deleteFilterSchedule(filter: ISearchFilter) {
        const {gettext} = superdeskApi.localization;
        const {confirm} = superdeskApi.ui;

        confirm(
            gettext('Schedule will be permanently deleted.'),
            gettext('Delete Item?')
        ).then((confirmed) => {
            if (confirmed) {
                this.props.deleteFilterSchedule(filter);
            }
        });
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown = (event) => {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.handleHide();
        }
    }

    editFilter = (filter: Partial<ISearchFilter> = null) => {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'edit',
            isPristine: true,
            pendingFilter: null,
        });
    }

    editFilterWithConfirmation = (filter: Partial<ISearchFilter> = null) => {
        if (this.state.contentPanelState === 'edit' && !this.state.isPristine) {
            this.setState({pendingFilter: filter});
        } else {
            this.editFilter(filter);
        }
    }

    onDontSave = () => {
        const {pendingFilter} = this.state;

        this.editFilter(pendingFilter);
    }

    onSaveAndSwitch = () => {
        const {createOrUpdate} = this.props;
        const {pendingFilter} = this.state;
        const filter = this.state.selectedFilter;
        const updates = {
            ...filter,
        };

        createOrUpdate(updates).then(() => {
            this.editFilter(pendingFilter);
        });
    }

    onCancelSwitch = () => {
        this.setState({pendingFilter: null});
    }

    previewFilter = (filter: ISearchFilter) => {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'preview',
        });
    }

    editFilterSchedule = (filter: ISearchFilter) => {
        this.setState({
            selectedFilter: filter,
            contentPanelState: 'schedule',
        });
    }

    closeEditor = () => {
        this.setState({
            selectedFilter: null,
            contentPanelState: null,
            isPristine: true,
        });
    }

    onPristineChange = (pristine: boolean) => {
        this.setState({isPristine: pristine});
    }

    getContentPanelComponent = (): React.ComponentType<IEventsPlanningContentPanelProps> | null => {
        switch (this.state.contentPanelState) {
        case 'edit':
            return EditFilter;
        case 'preview':
            return PreviewFilter;
        case 'schedule':
            return EditFilterSchedule;
        default:
            return null;
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {handleHide, privileges, createOrUpdate} = this.props;

        const rightPanelClasses = this.state.contentPanelState != null ?
            'sd-main-content-grid__preview open-preview' :
            'sd-main-content-grid__preview';
        const ContentPanel = this.getContentPanelComponent();

        return (
            <Modal
                data-test-id="search-filters-modal"
                visible
                closeOnEscape
                contentPadding="none"
                size="x-large"
                className="sd-content-wrapper__main-content-area sd-main-content-grid comfort"
                onHide={handleHide}
                headerTemplate={gettext('Manage Events & Planning Filters')}
                footerTemplate={(
                    <Button
                        onClick={handleHide}
                        text={gettext('Close')}
                        type="tertiary"
                    />
                )}
            >
                <div className="sd-main-content-grid__content">
                    {!!privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] && (
                        <SubNav className="px-2 sd-flex justify-end">
                            <Button
                                text={gettext('Add New Filter')}
                                onClick={() => this.editFilter()}
                                data-test-id="manage-filters--add-new-filter"
                                type="primary"
                                icon="plus-sign"
                            />
                        </SubNav>
                    )}
                    <ColumnBox.Box verticalScroll={true}>
                        <ColumnBox.MainColumn padded={true}>
                            <FiltersList
                                activeFilterId={this.state.selectedFilter?._id}
                                privileges={privileges}
                                deleteFilter={this.deleteFilter}
                                editFilter={this.editFilterWithConfirmation}
                                editFilterSchedule={this.editFilterSchedule}
                                deleteFilterSchedule={this.deleteFilterSchedule}
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
                                    key={this.state.selectedFilter?._id ?? 'new'}
                                    filter={this.state.selectedFilter}
                                    onClose={this.closeEditor}
                                    onSave={createOrUpdate}
                                    editFilter={this.editFilter}
                                    editFilterSchedule={this.editFilterSchedule}
                                    previewFilter={this.previewFilter}
                                    deleteFilterSchedule={this.deleteFilterSchedule}
                                    onPristineChange={this.onPristineChange}
                                />
                            )}
                        </SidePanel>
                    </div>
                </div>
                {this.state.pendingFilter != null && (
                    <Modal
                        visible
                        size="small"
                        position="top"
                        onHide={this.onCancelSwitch}
                        headerTemplate={gettext('Save changes?')}
                        footerTemplate={(
                            <ButtonGroup align="end">
                                <Button
                                    text={gettext('Go Back')}
                                    onClick={this.onCancelSwitch}
                                    type="tertiary"
                                />
                                <Button
                                    text={gettext('Don\'t Save')}
                                    onClick={this.onDontSave}
                                    type="default"
                                />
                                <Button
                                    text={gettext('Save')}
                                    onClick={this.onSaveAndSwitch}
                                    type="primary"
                                />
                            </ButtonGroup>
                        )}
                    >
                        {gettext('Your changes will be lost if you switch now. What would you like to do?')}
                    </Modal>
                )}
            </Modal>
        );
    }
}

export const ManageFiltersModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageFiltersComponent);
