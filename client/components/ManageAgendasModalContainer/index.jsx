import React from 'react'
import { Modal, AgendaItem } from '../../components'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { orderBy } from 'lodash'
import { SpikeAgendaConfirmationContainer } from '../index'
import './style.scss'

export function ManageAgendasModalComponent({
    handleHide,
    activeAgendas,
    spikedAgendas,
    openCreateAgenda,
    openEditAgenda,
    onAgendaSpiked,
    onAgendaUnspiked,
    selectAgenda,
    privileges,
}) {
    return (
        <Modal
            show={true}
            onHide={handleHide}
            large={true}
            className="ManageAgendasModal"
        >
            <Modal.Header>
                <a className="close" onClick={handleHide}>
                    <i className="icon-close-small" />
                </a>
                <h3>Manage Agendas</h3>
            </Modal.Header>
            <Modal.Body>
                <div>
                    {activeAgendas.length === 0 && spikedAgendas.length === 0 &&
                        <div>
                            <p>There is no agenda yet.</p>
                            {privileges.planning_agenda_management === 1 && (
                                <Button type="button" bsClass="btn btn--primary" onClick={openCreateAgenda}>
                                    <i className="icon-plus-sign icon-white"/>
                                    Create one
                                </Button>
                            )}
                        </div>
                    ||
                        <div>
                            {privileges.planning_agenda_management === 1 && (
                                <Button type="button" bsClass="btn btn--primary" onClick={openCreateAgenda}>
                                    <i className="icon-plus-sign icon-white"/>
                                    Add a new agenda
                                </Button>
                            )}
                        </div>
                    }

                    <div className="ActiveAgendas">
                        <span className="form-label"><strong>Active Agendas</strong></span>
                    {activeAgendas.length > 0 &&
                        <ul className="pills-list provider-list">
                            {activeAgendas.map((agenda) => (
                                <AgendaItem
                                    agenda={agenda}
                                    onClick={selectAgenda.bind(null, agenda)}
                                    editEvent={openEditAgenda.bind(null, agenda)}
                                    spikeEvent={onAgendaSpiked.bind(null, agenda)}
                                    key={agenda._id}
                                    privileges={privileges} />
                            ))}
                        </ul>
                    ||
                        <p>There are no active agendas.</p>
                    }
                    </div>

                    {spikedAgendas.length > 0 &&
                        <div className="SpikedAgendas">
                            <span className="form-label"><strong>Spiked Agendas</strong></span>
                            <ul className="pills-list provider-list">
                                {spikedAgendas.map((agenda) => (
                                    <AgendaItem
                                        agenda={agenda}
                                        onClick={selectAgenda.bind(null, agenda)}
                                        editEvent={openEditAgenda.bind(null, agenda)}
                                        spikeEvent={onAgendaUnspiked.bind(null, agenda)}
                                        key={agenda._id}
                                        privileges={privileges} />
                                ))}
                            </ul>
                        </div>
                    }
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

ManageAgendasModalComponent.propTypes = {
    handleHide: React.PropTypes.func,
    activeAgendas: React.PropTypes.array,
    spikedAgendas: React.PropTypes.array,
    openCreateAgenda: React.PropTypes.func,
    openEditAgenda: React.PropTypes.func,
    onAgendaSpiked: React.PropTypes.func,
    onAgendaUnspiked: React.PropTypes.func,
    selectAgenda: React.PropTypes.func,
    privileges: React.PropTypes.object.isRequired,
}

const mapStateToProps = (state) => (
    {
        activeAgendas: orderBy(selectors.getActiveAgendas(state), ['_created'], ['desc']),
        spikedAgendas: orderBy(selectors.getSpikedAgendas(state), ['_created'], ['desc']),
        privileges: selectors.getPrivileges(state),
    }
)

const mapDispatchToProps = (dispatch) => ({
    selectAgenda: (agendaId) => dispatch(actions.selectAgenda(agendaId)),
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    openEditAgenda: (agenda) => dispatch(actions.showModal({
        modalType: 'EDIT_AGENDA',
        modalProps: { agenda },
    })),
    onAgendaSpiked: (agenda) => (
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: <SpikeAgendaConfirmationContainer agenda={agenda}/>,
                action: () => dispatch(actions.spikeAgenda(agenda)),
            },
        }))
    ),
    onAgendaUnspiked: (agenda) => (
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: <SpikeAgendaConfirmationContainer agenda={agenda}/>,
                action: () => dispatch(actions.unspikeAgenda(agenda)),
            },
        }))
    ),
})

export const ManageAgendasModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageAgendasModalComponent)
