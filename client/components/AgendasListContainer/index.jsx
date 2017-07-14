import React from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { orderBy } from 'lodash'
import { AgendaList } from '../../components'

export function AgendasListComponent({
    enabledAgendas,
    disabledAgendas,
    openCreateAgenda,
    openEditAgenda,
    privileges,
}) {
    return (
        <div className="split-content AgendaList">
            <div className="header">
                <h2>Manage Agendas</h2>
                {privileges.planning_agenda_management === 1 && (
                    <Button type="button"
                            bsClass="btn btn--primary"
                            className="pull-right"
                            onClick={openCreateAgenda}
                    >
                        <i className="icon-plus-sign icon-white"/>
                        Add a new agenda
                    </Button>
                )}
            </div>
            <div className="content">
                <div className="agenda-group">
                    <span className="form-label"><strong>Active Agendas</strong></span>
                    {enabledAgendas.length > 0 &&
                        <AgendaList
                            privileges={privileges}
                            openEditAgenda={openEditAgenda}
                            agendas={enabledAgendas}
                            classNames="sd-list-item-group sd-list-item-group--space-between-items"/>
                    ||
                        <p>There are no active agendas.</p>
                    }
                </div>
                <div className="agenda-group">
                    <span className="form-label"><strong>Disable Agendas</strong></span>
                    {disabledAgendas.length > 0 &&
                        <AgendaList
                            privileges={privileges}
                            openEditAgenda={openEditAgenda}
                            agendas={disabledAgendas}
                            classNames="sd-list-item-group sd-list-item-group--space-between-items"/>
                    ||
                        <p>There are no disabled agendas.</p>
                    }
                </div>
            </div>
        </div>
    )
}

AgendasListComponent.propTypes = {
    enabledAgendas: React.PropTypes.array,
    disabledAgendas: React.PropTypes.array,
    privileges: React.PropTypes.object.isRequired,
    openCreateAgenda: React.PropTypes.func,
    openEditAgenda: React.PropTypes.func,
}

const mapStateToProps = (state) => (
    {
        enabledAgendas: orderBy(selectors.getEnabledAgendas(state), ['name'], ['asc']),
        disabledAgendas: orderBy(selectors.getDisabledAgendas(state), ['name'], ['asc']),
        privileges: selectors.getPrivileges(state),
    }
)

const mapDispatchToProps = (dispatch) => ({
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    openEditAgenda: (agenda) => dispatch(actions.showModal({
        modalType: 'EDIT_AGENDA',
        modalProps: { agenda },
    })),
})


export const AgendasListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AgendasListComponent)
