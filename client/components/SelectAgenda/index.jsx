import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { selectAgenda } from '../../actions'
import { AGENDA } from '../../constants'
import { getCurrentAgendaId, getEnabledAgendas, getDisabledAgendas } from '../../selectors'

export const SelectAgendaComponent = ({ enabledAgendas, disabledAgendas, onChange, currentAgenda, isLoading }) => (
    <select onChange={onChange} value={currentAgenda || ''}>
        <option value="">
            {isLoading && 'Loading...' || 'Select an agenda'}
        </option>
        {enabledAgendas.map((agenda) => (
            <option
                key={agenda._id}
                value={agenda._id}>{agenda.name}
            </option>
        ))}
        {Object.keys(disabledAgendas).length > 0 && (
            <option disabled>──────────</option>
        )}
        {disabledAgendas.map((agenda) => (
            <option
                key={agenda._id}
                value={agenda._id}>{agenda.name} - [Disabled]
            </option>
        ))}
        <option disabled>──────────</option>
        <option value={AGENDA.FILTER.NO_AGENDA_ASSIGNED}>No Agenda Assigned</option>
    </select>
)

SelectAgendaComponent.propTypes = {
    enabledAgendas: PropTypes.array.isRequired,
    disabledAgendas: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    currentAgenda: PropTypes.string,
    isLoading: PropTypes.bool,
}

const mapStateToProps = (state) => ({
    currentAgenda: getCurrentAgendaId(state),
    enabledAgendas: getEnabledAgendas(state),
    disabledAgendas: getDisabledAgendas(state),
    isLoading: state.agenda.agendasAreLoading,
})

const mapDispatchToProps = (dispatch) => ({ onChange: (event) => (dispatch(selectAgenda(event.target.value || null))) })

export const SelectAgenda = connect(mapStateToProps, mapDispatchToProps)(SelectAgendaComponent)
