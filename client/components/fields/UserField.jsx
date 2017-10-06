import { CreatableField } from './CreatableField'
import { connect } from 'react-redux'
import { get } from 'lodash'


const mapStateToProps = (state, ownProps) => ({
    multi: ownProps.multi || false,
    options: (ownProps.users || []).map((user) => (
        {
            label: user.display_name ,
            value: user,
        }
    )),
    value: {
        label: get(ownProps.input, 'value.display_name') || '',
        value: ownProps.input.value,
    },
})

export const UserField = connect(mapStateToProps)(CreatableField)
