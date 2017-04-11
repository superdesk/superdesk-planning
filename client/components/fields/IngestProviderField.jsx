import { CreatableField } from './CreatableField'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: state.ingest.providers.map((provider) => (
        {
            label: provider.name,
            value: provider,
        }
    )),
    value: (ownProps.input.value || []).map((provider) => (
        {
            label: provider.name,
            value: provider,
        }
    )),
})

export const IngestProviderField = connect(mapStateToProps)(CreatableField)
