import { SelectField } from './SelectField'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: false,
    clearable: true,
    options: state.genres.map((genre) => (
        {
            label: genre.name,
            value: genre,
        }
    )),
    value: {
        label: ownProps.input.value.name,
        value: ownProps.input.value,
    },
})

export const GenreField = connect(mapStateToProps)(SelectField)
