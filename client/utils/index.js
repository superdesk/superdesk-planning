import moment from 'moment'
import { get, set } from 'lodash'

export const eventIsAllDayLong = (dates) => (
    // is a multiple of 24h
    moment(dates.start).diff(moment(dates.end), 'minutes') % (24 * 60) === 0
)

export const RequiredFieldsValidator = (fields) => (
    values => {
        const errors = {}
        fields.forEach((field) => {
            if (!get(values, field)) {
                set(errors, field, 'Required')
            }
        })
        return errors
    }
)
