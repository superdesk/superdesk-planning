import React from 'react';
import PropTypes from 'prop-types';
import {Row, LineInput, Input, TextArea, Label} from './';
import {IconButton} from '../';
import {onEventCapture, gettext} from '../utils';
import {get, isArrayLikeObject} from 'lodash';
import './style.scss';

/**
 * @ngdoc react
 * @name FileInput
 * @description Component to sattach files as input
 */
export class FileInput extends React.Component {
    constructor(props) {
        super(props);
        this.dom = {fileInput: null};
        this.onAdd = this.onAdd.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.getComponent = this.getComponent.bind(this);
        this.onBrowseClick = this.onBrowseClick.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
    }

    onBrowseClick() {
        if (this.dom.fileInput) {
            this.handleOnFocus();
            this.dom.fileInput.click();
        }
    }

    onDragEnter(e) {
        e.dataTransfer.dropEffect = 'copy';
    }

    handleOnFocus() {
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    }

    onDrop(event) {
        onEventCapture(event);
        if (get(event, 'dataTransfer.files')) {
            this.handleOnFocus();
            this.onAdd(null, event.dataTransfer.files);
        }
    }

    onAdd(field, fileList) {
        this.props.onAddFiles(fileList);
    }

    onRemove(index) {
        this.handleOnFocus();
        this.props.onRemoveFile(this.props.files[this.props.value[index]]);
    }

    getComponent(val, index = 0) {
        const {readOnly, onFocus, field, createLink, noMargin} = this.props;

        return readOnly ? (
            <Row key={index} noPadding>
                {get(val, 'media') && (<LineInput noMargin={noMargin}>
                    <a
                        href={createLink(val)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {val.media.name}&nbsp;
                        ({Math.round(val.media.length / 1024)}kB)
                    </a>
                </LineInput>)}
            </Row>
        ) : (
            <Row className="file-input" key={index} noPadding>
                {get(val, 'media') && (
                    <LineInput>
                        <a className="icn-btn sd-line-input__icon-right" onClick={this.onRemove.bind(null, index)}>
                            <i className="icon-trash" />
                        </a>
                        <a
                            className="file-input__file"
                            href={createLink(val)}
                            onFocus={onFocus}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {val.media.name}&nbsp;
                            ({Math.round(val.media.length / 1024)}kB)
                        </a>
                    </LineInput>
                ) ||
                (
                    <LineInput readOnly={readOnly} noMargin={noMargin}>
                        <TextArea
                            className="file-input__file"
                            field={field}
                            value={get(val, 'name')}
                            readOnly={true}
                            paddingRight60={true}
                            autoFocus
                            tabIndex={0}
                            multiLine={false}
                            onFocus={onFocus}
                        />

                        <span className="sd-line-input__icon-bottom-right">
                            <IconButton
                                onClick={this.onRemove.bind(null, index)}
                                tabIndex={0}
                                icon="icon-trash"
                                enterKeyIsClick={true}
                            />
                        </span>
                    </LineInput>
                )}
            </Row>
        );
    }

    getFileItems() {
        const {value, files} = this.props;

        if (!value) {
            return null;
        }

        const objectValues = (Array.isArray(value) ? value : [value]).map((v) =>
            (isArrayLikeObject(v) ? v[0] : files[v]));

        return objectValues.map((val, index) => this.getComponent(val, index));
    }

    render() {
        const {field, readOnly, onFocus, hideInput, label, formats} = this.props;

        return (<Row>
            <Label text={label} />
            {this.getFileItems()}
            {!hideInput && !readOnly && <div onDrop={this.onDrop}
                onDragEnter={this.onDragEnter} className="basic-drag-block">
                <i className="big-icon--upload-alt" />
                <span className="basic-drag-block__text">{gettext('Drag files here or') + ' '}</span>
                <a className="text-link link" onClick={this.onBrowseClick}>&nbsp;{gettext('browse')}
                    <Input
                        className="file-input--hidden"
                        field={field}
                        onChange={this.onAdd}
                        type="file"
                        accept={formats}
                        onFocus={onFocus}
                        autoFocus
                        refNode={(node) => {
                            this.dom.fileInput = node;
                        }} />
                </a>
            </div>}
        </Row>);
    }
}

FileInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    onChange: PropTypes.func,
    createLink: PropTypes.func,
    onRemoveFile: PropTypes.func,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
    noMargin: PropTypes.bool,
    files: PropTypes.object,
    onAddFiles: PropTypes.func,
    hideInput: PropTypes.bool,
    formats: PropTypes.string,
};

FileInput.defaultProps = {noMargin: true};
