import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../index';
import {gettext} from '../../utils';
import {MODALS, PRIVILEGES} from '../../constants';
import {SubNav, StretchBar, Button} from '../UI/SubNav';
import {ColumnBox} from '../UI';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {FiltersList} from './FiltersList';
import {EditFilter} from './EditFilter';


export class ManageFiltersComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorOpen: false,
            selectedFilter: null,
        };

        this.editFilter = this.editFilter.bind(this);
        this.toggleEditor = this.toggleEditor.bind(this);
    }

    toggleEditor() {
        if (this.state.editorOpen) {
            // Closing - set selected filter to null
            this.setState({
                editorOpen: !this.state.editorOpen,
                selectedFilter: null,
            });
        } else {
            this.setState({editorOpen: !this.state.editorOpen});
        }
    }

    editFilter(filter) {
        this.setState({
            selectedFilter: filter,
            editorOpen: true,
        });
    }

    render() {
        const {handleHide, privileges, filters, deleteFilter, createOrUpdate} = this.props;

        return (
            <Modal xLarge={true} show={true} onHide={handleHide}>
                <Modal.Header>
                    <a className="close" onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">{gettext('Manage Events & Planning Filters')}</h3>
                </Modal.Header>
                <Modal.Body noPadding={true} noScroll>
                    <div className="EventsPlanningFilter">
                        {!!privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] && <SubNav>
                            <StretchBar />
                            {!this.state.editorOpen && <Button
                                right={true}
                                buttonClassName="btn btn--primary"
                                onClick={this.toggleEditor}>
                                <i className="icon-plus-sign icon-white" />
                                {gettext('Add New Filter')}
                            </Button>}
                        </SubNav>}
                        <ColumnBox.Box>
                            <ColumnBox.MainColumn padded={true} verticalScroll={true}>
                                <FiltersList
                                    filters={filters}
                                    privileges={privileges}
                                    deleteFilter={deleteFilter}
                                    editFilter={this.state.editorOpen ? null : this.editFilter}
                                    calendars={this.props.calendars}
                                    agendas={this.props.agendas}
                                />
                            </ColumnBox.MainColumn>
                            {this.state.editorOpen &&
                                <ColumnBox.SlideInColumn>
                                    <EditFilter
                                        filter={this.state.selectedFilter}
                                        onClose={this.toggleEditor}
                                        onSave={createOrUpdate}
                                        enabledAgendas={this.props.enabledAgendas}
                                        enabledCalendars={this.props.enabledCalendars}
                                    />
                                </ColumnBox.SlideInColumn>
                            }
                        </ColumnBox.Box>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

ManageFiltersComponent.propTypes = {
    handleHide: PropTypes.func,
    privileges: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
    deleteFilter: PropTypes.func.isRequired,
    createOrUpdate: PropTypes.func.isRequired,
    enabledCalendars: PropTypes.array.isRequired,
    enabledAgendas: PropTypes.array.isRequired,
    calendars: PropTypes.array.isRequired,
    agendas: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => (
    {
        privileges: selectors.general.privileges(state),
        filters: selectors.eventsPlanning.combinedViewFilters(state),
        enabledAgendas: selectors.general.enabledAgendas(state),
        enabledCalendars: selectors.events.enabledCalendars(state),
        calendars: selectors.events.calendars(state),
        agendas: selectors.planning.agendas(state),
    }
);

const mapDispatchToProps = (dispatch) => ({
    deleteFilter: (filter) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            body: `Do you want to delete "${filter.name}" filter ?`,
            action: () => dispatch(actions.eventsPlanning.ui.deleteFilter(filter)),
            autoClose: true,
        },
    })),
    createOrUpdate: (filter) => dispatch(actions.eventsPlanning.ui.saveFilter(filter)),
});

export const ManageFiltersModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageFiltersComponent);