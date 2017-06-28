import React from 'react'

export class RepeatEventSummary  extends React.Component {
    constructor(props) {
        super(props)
    }

    getDaysFromByDays() {
        let byDays = this.props.byDay && this.props.byDay.length > 0 ? this.props.byDay :
            this.props.startDate ? this.props.startDate.format('dd').toUpperCase() : ''

        if (byDays) {
            const days = {
                'MO': 'Monday',
                'TU': 'Tuesday',
                'WE': 'Wednesday',
                'TH': 'Thursday',
                'FR': 'Friday',
                'SA': 'Saturday',
                'SU': 'Sunday',
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
        switch(this.props.frequency) {
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
        if (this.props.endRepeatMode !== 'unlimited') {
            if (this.props.endRepeatMode === 'count' && parseInt(this.props.count) > 0) {
                suffix = ', ' + this.props.count + ' times'
            } else if (this.props.endRepeatMode === 'until' && this.props.until &&
                this.props.until.isValid()) {
                suffix = ', until ' + this.props.until.format('D MMM YYYY')
            }
        }
        return suffix
    }

    getRepeatSummary() {
        const stemText = this.getStemText()
        return this.getPrefix() + (stemText !== '' ? ( ' ' + stemText ) : '') + this.getSuffix()
    }

    render() {
        return (
            <div>
                <span><strong className='repeatSummary'>{'Repeat summary: ' + this.getRepeatSummary()}</strong>
                </span>
            </div>
        )
    }
}

RepeatEventSummary.propTypes = {
    byDay: React.PropTypes.string,
    interval: React.PropTypes.number,
    frequency: React.PropTypes.string,
    endRepeatMode: React.PropTypes.string,
    until: React.PropTypes.object,
    count: React.PropTypes.string,
    startDate: React.PropTypes.object,
}
