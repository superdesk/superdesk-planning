import React, { PropTypes } from 'react'
import classNames from 'classnames'

export class DaysOfWeek extends React.Component {
    constructor(props) {
        super(props)
        let days = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false,
        }
        props.input.value.split(' ').forEach((day) => {
            if (Object.keys(days).indexOf(day) > -1) {
                days[day] = true
            }
        })
        this.state = days
    }

    handleOnChange(e) {
        // update the state with the new (un)checked day
        this.setState({ [e.target.value]: e.target.checked }, () => {
            // keep only the checked days
            let daysInString = Object.keys(this.state).map((d) => {
                if (this.state[d]) {
                    return d
                }
            })
            // keep only not undefined values in array
            .filter((d) => (d))
            // join array to produce the string we want to store
            .join(' ')
            this.props.input.onChange(daysInString)
        })
    }

    render() {
        const { touched, error, warning } = this.props.meta
        const readOnly = this.props.readOnly

        return (
            <div>
                {Object.keys(this.state).map((d) => (
                    <label key={d}>
                        <input
                            type="checkbox"
                            className={classNames({ 'disabledInput': readOnly })}
                            disabled={readOnly ? 'disabled' : ''}
                            value={d}
                            checked={this.state[d]}
                            onChange={this.handleOnChange.bind(this)} />
                        {d}
                    </label>
                ))}
                {touched && ((error && <span className="error-block">{error}</span>) ||
                 (warning && <span className="help-block">{warning}</span>))}
            </div>
        )
    }
}

DaysOfWeek.propTypes = {
    input: PropTypes.object,
    meta: React.PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
}
