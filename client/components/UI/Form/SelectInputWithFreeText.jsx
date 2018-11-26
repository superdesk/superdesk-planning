import React from 'react';
import PropTypes from 'prop-types';

import {SelectInput, Checkbox, Input, LineInput, Label, Row} from './index';

import './style.scss';

/**
 * @ngdoc react
 * @name SelectInputWithFreeText
 * @description Form component to input free-text with droplist
 */
export class SelectInputWithFreeText extends React.Component {
    constructor(props) {
        super(props);

        this.state = {enterFreeText: false};

        this.onFreeTextToggle = this.onFreeTextToggle.bind(this);
    }

    onFreeTextToggle() {
        this.setState({enterFreeText: !this.state.enterFreeText});
    }


    render() {
        const {
            field,
            label,
            onChange,
            value,
            options,
            labelField,
            ...props
        } = this.props;

        return (
            <Row flex noPadding>
                {!this.state.enterFreeText && <SelectInput
                    field={field}
                    label={label}
                    onChange={onChange}
                    value={value}
                    options={options}
                    labelField={labelField}
                    {...props} />}
                {this.state.enterFreeText &&
                    <LineInput {...props}>
                        <Label text={label} />
                        <Input placeholder={label} onChange={onChange} field={field} />
                    </LineInput>
                }
                <LineInput {...props}>
                    <Label text="Other" />
                    <Checkbox
                        value={this.state.enterFreeText}
                        onChange={this.onFreeTextToggle}
                    />
                </LineInput>
            </Row>
        );
    }
}

SelectInputWithFreeText.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string,
    options: PropTypes.array,
    labelField: PropTypes.string,
};
