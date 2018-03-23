import React from 'react';
import PropTypes from 'prop-types';
import {Row, LineInput, Label, Input} from './';
import {get} from 'lodash';
import './style.scss';

export const FileInput = ({field, label, value, onChange, createLink, remove, readOnly, ...props}) =>
    readOnly ? (
        <Row>
            <LineInput noMargin={true}>
                <Label text={`${value.media.content_type} (${Math.round(value.media.length / 1024)}kB)`} />
                <a href={createLink(value)} target="_blank">
                    {value.media.name}
                </a>
            </LineInput>
        </Row>
    ) : (
        <Row className="file-input">
            {get(value, 'media') && (
                <LineInput {...props}>
                    <a className="icn-btn sd-line-input__icon-right" onClick={remove}>
                        <i className="icon-trash" />
                    </a>
                    <a href={createLink(value)} target="_blank">
                        {value.media.name}&nbsp;
                        ({Math.round(value.media.length / 1024)}kB)
                    </a>
                </LineInput>
            ) ||
            (
                <LineInput {...props}>
                    <Label text={label} />
                    <a className="icn-btn sd-line-input__icon-right" onClick={remove}>
                        <i className="icon-trash" />
                    </a>
                    <Input field={field} onChange={onChange} type="file" autoFocus/>
                </LineInput>
            )}
        </Row>
    );

FileInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    onChange: PropTypes.func,
    createLink: PropTypes.func,
    remove: PropTypes.func,

    readOnly: PropTypes.bool,
    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

FileInput.defaultProps = {
    readOnly: false,
    required: false,
    invalid: false,
    boxed: false,
    noMargin: false,
};
