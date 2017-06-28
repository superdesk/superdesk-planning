import React, { PropTypes } from 'react'
import moment from 'moment'
import ReactDOM from 'react-dom'
import { DayPicker } from './DayPicker'
import { MonthPicker } from './MonthPicker'
import { YearPicker } from './YearPicker'
import './styles.scss'

export class DatePickerCore extends React.Component {
    constructor(props) {
        super(props)
        const currentDate = moment()
        this.state = {
            mode: 'day',
            modeTitle: this.getModeTitle(currentDate, 'day'),
            currentDate: currentDate,
            selectedDate: currentDate,
        }
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    componentWillMount() {
        if (this.props.value && moment.isMoment(this.props.value))
        {
            this.setState({
                mode: 'day',
                modeTitle: this.getModeTitle(this.props.value, 'day'),
                selectedDate: this.props.value.clone(),
            })
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    handleModeChange() {
        const maxMode = this.props.maxMode || 'year'
        if (this.state.mode === 'day' && maxMode !== 'month') {
            this.setState({
                mode: 'month',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'month'),
            })
        } else if (this.state.mode === 'month') {
            this.setState({
                mode: 'year',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'year'),
            })
        }

    }

    getFurtherValues(direction) {
        let diff = 1, diffType = ''
        switch (this.state.mode) {
            case 'day':
                // Have to change the month to previous value
                diffType = 'months'
                break
            case 'month':
                // Have to change the year to previous value
                diffType = 'years'
                break
            case 'year':
                diff = 20
                diffType = 'years'
                break
        }

        const newDate = direction ? this.state.selectedDate.clone().add(diff, diffType) :
            this.state.selectedDate.clone().subtract(diff, diffType)

        this.setState({
            modeTitle: this.getModeTitle(newDate, this.state.mode),
            selectedDate: newDate,
        })

    }

    handleConfirm(toolSelect /*0-Today, 1-Tomorrow, 2-In two days*/) {
        switch (toolSelect) {
            case 0:
                this.props.onChange(this.state.currentDate)
                break
            case 1:
                this.props.onChange(this.state.currentDate.clone().add(1, 'days'))
                break
            case 2:
                this.props.onChange(this.state.currentDate.clone().add(2, 'days'))
                break
            default:
                if (this.state.mode !== 'day') {
                    // If we are not in the day picking mode calender view,
                    // as per original SD Datepicker, confirm will mean current date
                    this.props.onChange(this.state.currentDate)
                } else {
                    this.props.onChange(this.state.selectedDate)
                }
                break
        }

        this.props.onCancel()
    }

    getStartingYearForYearPicker(date) {
        const yearRange = this.props.yearRange || 20
        return parseInt((date.year() - 1) / yearRange, 10) * yearRange + 1
    }

    handleCancel() {
        this.props.onCancel()
    }

    getModeTitle (date, mode) {
        const yearRange = this.props.yearRange || 20
        switch(mode) {
            case 'day': return date.format('MMMM YYYY')
            case 'month': return date.format('YYYY')
            case 'year':
                return this.getStartingYearForYearPicker(date) + '-' +
                (this.getStartingYearForYearPicker(date) + yearRange - 1)
        }
    }

    handleSelectChange(newDate) {
        let nextMode = ''
        switch (this.state.mode) {
            case 'day':
                nextMode = 'day'
                break
            case 'month':
                nextMode = 'day'
                break
            case 'year':
                nextMode = 'month'
                break
        }

        if (!(this.state.selectedDate.isSame(newDate) && this.state.mode === 'day')) {
            this.setState({
                selectedDate: newDate,
                mode: nextMode,
                modeTitle: this.getModeTitle(newDate, nextMode),
            })
        }
    }

    render() {
        return (
            <div className="datepickerPopup">
                <div className="datepickerPopup__Additional">
                    <table>
                        <tbody>
                            <tr>
                                <td><button type="button" className="btn btn--mini" onClick={this.handleConfirm.bind(this,0)}>Today</button></td>
                                <td><button type="button" className="btn btn--mini" onClick={this.handleConfirm.bind(this,1)}>Tomorrow</button></td>
                                <td><button type="button" className="btn btn--mini" onClick={this.handleConfirm.bind(this,2)}>In 2 days</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="datepickerPopup__Tools">
                    <table>
                          <tbody>
                            <tr>
                              <td><button type="button" className="btn btn-default btn-sm pull-left"><i className="icon-chevron-left-thin" onClick={this.getFurtherValues.bind(this, 0)}/></button></td>
                              <td><button type="button" aria-live="assertive" aria-atomic="true" className="btn btn-default btn-sm" onClick={this.handleModeChange.bind(this)}><strong>{this.state.modeTitle}</strong></button></td>
                              <td><button type="button" className="btn btn-default btn-sm pull-right" onClick={this.getFurtherValues.bind(this, 1)}><i className="icon-chevron-right-thin"/></button></td>
                            </tr>
                          </tbody>
                    </table>
                </div>
                <div className="datepickerPopup__core">
                    { this.state.mode === 'day' && (
                        <DayPicker selectedDate={this.state.selectedDate} onChange={this.handleSelectChange.bind(this)} />
                    )}
                    { this.state.mode === 'month' && (
                        <MonthPicker selectedDate={this.state.selectedDate} onChange={this.handleSelectChange.bind(this)} />
                    )}
                    { this.state.mode === 'year' && (
                        <YearPicker startingYear={this.getStartingYearForYearPicker(this.state.selectedDate)} selectedDate={this.state.selectedDate} onChange={this.handleSelectChange.bind(this)} />
                    )}
                </div>
                <button className="btn btn--primary btn--small pull-right" type="button" onClick={this.handleConfirm.bind(this)}>Confirm</button>
                <button className="btn btn--small pull-right" type="button" onClick={this.handleCancel.bind(this)}>Cancel</button>
            </div>
        )
    }
}

DatePickerCore.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    maxMode: PropTypes.string,
    yearRange: PropTypes.number,
}
