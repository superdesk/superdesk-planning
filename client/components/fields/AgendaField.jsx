import { SelectMetaTermsField } from './SelectMetaTermsField/'
import * as selectors from '../../selectors'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: selectors.getEnabledAgendas(state).map((agenda) => (
        {
            label: agenda.name,
            value: agenda,
        }
    )),
    value: (ownProps.input.value || []).map((agenda) => {
        // map the agenda id to agenda object as agendas are stored as list of ids for planning item.
        const agendas = state.agenda.agendas || []
        const currentAgenda = agenda.name ? agenda : agendas.find((a) => a._id === agenda)

        return {
            label: currentAgenda.name + (!currentAgenda.is_enabled ? ' - [Disabled]' : ''),
            value: currentAgenda,
        }
    }),
})

export const AgendaField = connect(mapStateToProps)(SelectMetaTermsField)
