import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get} from 'lodash';

import {Row, RowItem, LineInput, Label, Input, Checkbox, DateInput} from '../../UI/Form';
import {gettext} from '../../../utils';

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
            onChange({
                [`${fieldPrefix}endRepeatMode`]: 'count',
                [`${fieldPrefix}until`]: null
            });
        } else if (value === 'until') {
            onChange({
                [`${fieldPrefix}endRepeatMode`]: 'until',
                [`${fieldPrefix}count`]: null
            });
        }
    }

    onChange(field, value) {
        const {onChange, endRepeatMode, fieldPrefix} = this.props;
        const changes = {[`${fieldPrefix}${field}`]: value};

        if (field === 'count' && endRepeatMode === 'until') {
            changes[`${fieldPrefix}endRepeatMode`] = 'count';
            changes[`${fieldPrefix}until`] = null;
        } else if (field === 'until' && endRepeatMode === 'count') {
            changes[`${fieldPrefix}endRepeatMode`] = 'until';
            changes[`${fieldPrefix}count`] = null;
        }

        onChange(changes, null);
    }

    render() {
        const {label, endRepeatMode, count, until, dateFormat, readOnly, errors, popupContainer} = this.props;
        const invalid = !!(get(errors, 'count') || get(errors, 'until'));

        return (
            <div className="recurring-rules__end">
                <Label row={true} text={label} invalid={invalid}/>
                <Row flex={true} noPadding={true}>
                    <RowItem noGrow={true}>
                        <LineInput noLabel={true}>
                            <Checkbox
                                field="endRepeatMode"
                                value={endRepeatMode}
                                checkedValue="count"
                                type="radio"
                                label={gettext('After')}
                                labelPosition="inside"
                                onChange={this.handleModeChange}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    </RowItem>
                    <RowItem noGrow={true}>
                        <LineInput
                            noLabel={true}
                            invalid={!!get(errors, 'count')}
                            message={get(errors, 'count', '')} >
                            <Input
                                field="count"
                                value={count || ''}
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
                                label={gettext('On')}
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
                            invalid={!!get(errors, 'until')}
                            message={get(errors, 'until', '')}
                            popupContainer={popupContainer}
                        />
                    </RowItem>
                    <RowItem>
                        <Label row={true} text={gettext('Date')} />
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
    errors: PropTypes.object,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    popupContainer: PropTypes.func,
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
