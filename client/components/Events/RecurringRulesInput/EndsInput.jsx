import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {Row, RowItem, LineInput, Label, Input, Checkbox, DateInput} from '../../UI/Form';

import './style.scss';

export class EndsInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

        this.handleModeChange = this.handleModeChange.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    handleModeChange(field, value) {
        const {onChange, fieldPrefix} = this.props;

        if (value === 'count') {
            onChange(`${fieldPrefix}endRepeatMode`, 'count');
            onChange(`${fieldPrefix}until`, '');
        } else if (value === 'until') {
            onChange(`${fieldPrefix}endRepeatMode`, 'until');
            onChange(`${fieldPrefix}count`, '');
        }
    }

    onChange(field, value) {
        const {onChange, endRepeatMode, fieldPrefix} = this.props;

        if (field === 'count' && endRepeatMode === 'until') {
            onChange(`${fieldPrefix}endRepeatMode`, 'count');
            onChange(`${fieldPrefix}until`, '');
        } else if (field === 'until' && endRepeatMode === 'count') {
            onChange(`${fieldPrefix}endRepeatMode`, 'until');
            onChange(`${fieldPrefix}count`, '');
        }

        onChange(`${fieldPrefix}${field}`, value);
    }

    render() {
        const {label, endRepeatMode, count, until, dateFormat, readOnly} = this.props;

        return (
            <div className="recurring-rules__end">
                <Label row={true} text={label} />
                <Row flex={true} noPadding={true}>
                    <RowItem noGrow={true}>
                        <LineInput noLabel={true}>
                            <Checkbox
                                field="endRepeatMode"
                                value={endRepeatMode}
                                checkedValue="count"
                                type="radio"
                                label="After"
                                labelPosition="inside"
                                onChange={this.handleModeChange}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
                    <RowItem noGrow={true}>
                        <LineInput noLabel={true}>
                            <Input
                                field="count"
                                value={count}
                                onChange={this.onChange}
                                type="number"
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
                    <RowItem>
                        <Label row={true} text="Occurrences" />
                    </RowItem>
                </Row>
                <Row flex={true} noPadding={true}>
                    <RowItem noGrow={true}>
                        <LineInput noLabel={true}>
                            <Checkbox
                                field="endRepeatMode"
                                value={endRepeatMode}
                                checkedValue="until"
                                type="radio"
                                label="On"
                                labelPosition="inside"
                                onChange={this.handleModeChange}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
                    <RowItem noGrow={true}>
                        <DateInput
                            field="until"
                            placeholder=""
                            value={until}
                            onChange={this.onChange}
                            dateFormat={dateFormat}
                            readOnly={readOnly}
                        />
                    </RowItem>
                    <RowItem>
                        <Label row={true} text="Date" />
                    </RowItem>
                </Row>
            </div>
        );
    }
}

EndsInput.propTypes = {
    count: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    until: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    endRepeatMode: PropTypes.string,
    fieldPrefix: PropTypes.string,
    dateFormat: PropTypes.string.isRequired,

    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

EndsInput.defaultProps = {
    fieldPrefix: 'dates.recurring_rule.',
    label: 'Ends',

    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
