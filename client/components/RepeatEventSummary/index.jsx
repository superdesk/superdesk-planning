import React from 'react'
import PropTypes from 'prop-types'
import { InputField } from '../fields'

export class RepeatEventSummary  extends React.Component {
    constructor(props) {
        super(props)
    }

    getDaysFromByDays() {
        let byDays = this.props.byDay && this.props.byDay.length > 0 ? this.props.byDay :
            this.props.startDate ? this.props.startDate.format('dd').toUpperCase() : ''

        if (byDays) {
            const days = {
                MO: 'Monday',
                TU: 'Tuesday',
                WE: 'Wednesday',
                TH: 'Thursday',
                FR: 'Friday',
                SA: 'Saturday',
                SU: 'Sunday',
            }

            let dayNames = []

            byDays.split(' ').forEach((day) => {
                dayNames.push(days[day])
            })
            return dayNames
        }
    }

    getPrefix() {
        let prefix = ''
        if (this.props.interval > 1) {
            const duration = this.props.frequency === 'DAILY' ? 'days' :
                this.props.frequency.replace('LY', 's').toLowerCase()
            prefix = 'Every ' + this.props.interval + ' ' + duration
        } else {
            if (this.props.frequency) {
                const f = this.props.frequency
                prefix = f === 'YEARLY' ? 'Annualy' : (f.charAt(0).toUpperCase() + f.slice(1).toLowerCase())
            }
        }

        return prefix
    }

    getStemText() {
        let stemText = ''
        const days = this.getDaysFromByDays()
        switch (this.props.frequency) {
            case 'WEEKLY':
                stemText = days && days.length > 0 ? ('on ' + days.join(', ')) : ''
                break
            case 'MONTHLY':
                stemText = this.props.startDate ? ('on day ' + this.props.startDate.format('D')) : ''
                break
            case 'YEARLY':
                stemText = this.props.startDate ? ('on ' + this.props.startDate.format('MMM D')) : ''
                break
        }
        return stemText
    }

    getSuffix() {
        let suffix = ''
        if (this.props.endRepeatMode === 'count' && parseInt(this.props.count) > 0) {
            suffix = ', ' + this.props.count + ' times'
        } else if (this.props.endRepeatMode === 'until' && this.props.until &&
            this.props.until.isValid()) {
            suffix = ', until ' + this.props.until.format('D MMM YYYY')
        }

        return suffix
    }

    getRepeatSummary() {
        const stemText = this.getStemText()
        return this.getPrefix() + (stemText !== '' ? (' ' + stemText) : '') + this.getSuffix()
    }

    render() {
        return (
            <div>
                {this.props.asInputField ? (
                    <InputField
                        label="Repeats"
                        readOnly={true}
                        type="text"
                        input={{
                            value: this.getRepeatSummary(),
                            name: 'repeat_summary',
                        }}
                        meta={{}}
                    />
                ) : (
                    <div className="recurring__summary">
                        <span><strong className='repeatSummary'>
                            {'Repeat summary: ' + this.getRepeatSummary()}
                        </strong></span>
                    </div>
                )}
            </div>
        )
    }
}

RepeatEventSummary.propTypes = {
    byDay: PropTypes.string,
    interval: PropTypes.number,
    frequency: PropTypes.string,
    endRepeatMode: PropTypes.string,
    until: PropTypes.object,
    count: PropTypes.number,
    startDate: PropTypes.object,
    asInputField: PropTypes.bool,
}

RepeatEventSummary.defaultProps = { asInputField: false }
