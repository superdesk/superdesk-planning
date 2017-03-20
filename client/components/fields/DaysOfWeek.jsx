import React, { PropTypes } from 'react'

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
        return (
            <div>
                {Object.keys(this.state).map((d) => (
                    <label key={d}>
                        <input
                            type="checkbox"
                            value={d}
                            checked={this.state[d]}
                            onChange={this.handleOnChange.bind(this)} />
                        {d}
                    </label>
                ))}
            </div>
        )
    }
}

DaysOfWeek.propTypes = { input: PropTypes.object }
