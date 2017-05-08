import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { selectAgenda } from '../actions'
import { getCurrentAgendaId } from '../selectors'

export const SelectAgendaComponent = ({ agendas, onChange, currentAgenda, isLoading }) => (
    <select onChange={onChange} value={currentAgenda || ''}>
        <option>
            {isLoading && 'Loading...' || 'Select an agenda'}
        </option>
        {agendas.map((agenda) => (
            <option
                key={agenda._id}
                value={agenda._id}>{agenda.name}
            </option>
        ))}
    </select>
)

SelectAgendaComponent.propTypes = {
    agendas: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    currentAgenda: PropTypes.string,
    isLoading: PropTypes.bool,
}

const mapStateToProps = (state) => ({
    currentAgenda: getCurrentAgendaId(state),
    agendas: state.agenda.agendas,
    isLoading: state.agenda.agendasAreLoading,
})

const mapDispatchToProps = (dispatch) => ({ onChange: (event) => (dispatch(selectAgenda(event.target.value))) })

export const SelectAgenda = connect(mapStateToProps, mapDispatchToProps)(SelectAgendaComponent)
