import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import moment from 'moment'
import { orderBy, get } from 'lodash'
import { RemoveAgendaConfirmationContainer } from '../index'
import './style.scss'

export function ManageAgendasModalComponent({
    handleHide,
    agendas,
    onAgendaDeletion,
    openCreateAgenda,
    selectAgenda,
}) {
    return (
        <Modal show={true} onHide={handleHide} className="ManageAgendasModal">
            <Modal.Header>
                <a className="close" onClick={handleHide}>
                    <i className="icon-close-small" />
                </a>
                <h3>Manage Agendas</h3>
            </Modal.Header>
            <Modal.Body>
                {agendas.length === 0 &&
                    <div>
                        <p>There is no agenda yet.</p>
                        <Button type="button" bsClass="btn btn--primary" onClick={openCreateAgenda}>
                            <i className="icon-plus-sign icon-white"/>
                            Create one
                        </Button>
                    </div>
                    ||
                    <div>
                        <Button type="button" bsClass="btn btn--pull-right btn--primary" onClick={openCreateAgenda}>
                            <i className="icon-plus-sign icon-white"/>
                            Add a new agenda
                        </Button>
                        <ul className="pills-list provider-list">
                            {agendas.map((agenda) => (
                                <li key={agenda._id}>
                                    <div className="header">
                                        <h6 onClick={selectAgenda.bind(null, agenda._id)}>{agenda.name}</h6>
                                        <div className="last-updated">
                                            ({get(agenda, 'planning_items.length', '0')})
                                            &nbsp;created {moment(agenda._created).fromNow()}
                                        </div>
                                        <div className="actions">
                                            <button title="Remove source" onClick={onAgendaDeletion.bind(null, agenda)}>
                                                <i className="icon-trash"/>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

ManageAgendasModalComponent.propTypes = {
    handleHide: React.PropTypes.func,
    agendas: React.PropTypes.array,
    onAgendaDeletion: React.PropTypes.func,
    openCreateAgenda: React.PropTypes.func,
    selectAgenda: React.PropTypes.func,
}

const mapStateToProps = (state) => (
    { agendas: orderBy(selectors.getAgendas(state), ['_created'], ['desc']) }
)

const mapDispatchToProps = (dispatch) => ({
    selectAgenda: (agendaId) => dispatch(actions.selectAgenda(agendaId)),
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    onAgendaDeletion: (agenda) => (
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: <RemoveAgendaConfirmationContainer agenda={agenda}/>,
                action: () => dispatch(actions.deletePlanning(agenda)),
            },
        }))
    ),
})
export const ManageAgendasModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageAgendasModalComponent)
