import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { selectAgenda } from '../../actions'
import { getCurrentAgendaId, getActiveAgendas, getSpikedAgendas } from '../../selectors'

export const SelectAgendaComponent = ({ activeAgendas, spikedAgendas, onChange, currentAgenda, isLoading }) => (
    <select onChange={onChange} value={currentAgenda || ''}>
        <option>
            {isLoading && 'Loading...' || 'Select an agenda'}
        </option>
        {activeAgendas.map((agenda) => (
            <option
                key={agenda._id}
                value={agenda._id}>{agenda.name}
            </option>
        ))}
        {Object.keys(spikedAgendas).length > 0 && (
            <option disabled>──────────</option>
        )}
        {spikedAgendas.map((agenda) => (
            <option
                key={agenda._id}
                value={agenda._id}>{agenda.name} - [spiked]
            </option>
        ))}
    </select>
)

SelectAgendaComponent.propTypes = {
    activeAgendas: PropTypes.array.isRequired,
    spikedAgendas: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    currentAgenda: PropTypes.string,
    isLoading: PropTypes.bool,
}

const mapStateToProps = (state) => ({
    currentAgenda: getCurrentAgendaId(state),
    activeAgendas: getActiveAgendas(state),
    spikedAgendas: getSpikedAgendas(state),
    isLoading: state.agenda.agendasAreLoading,
})

const mapDispatchToProps = (dispatch) => ({ onChange: (event) => (dispatch(selectAgenda(event.target.value))) })

export const SelectAgenda = connect(mapStateToProps, mapDispatchToProps)(SelectAgendaComponent)
