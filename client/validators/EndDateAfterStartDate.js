export const EndDateAfterStartDate = (values) => {
    const errors = {}
    if (values.dates && values.dates.end && values.dates.start > values.dates.end) {
        errors.dates = { end: 'Must be greater than starting date' }
    }

    return errors
}

export default EndDateAfterStartDate
