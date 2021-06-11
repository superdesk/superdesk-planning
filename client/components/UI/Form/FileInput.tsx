import React from 'react';
import {Row, LineInput, Input, TextArea, Label} from './';
import {IconButton} from '../';
import {onEventCapture, gettext} from '../utils';
import {get, isArrayLikeObject} from 'lodash';
import './style.scss';
import {IFile} from '../../../interfaces';
import {KEYCODES} from '../../../constants';

interface IProps {
    field: string;
    label?: string;
    value: Array<IFile> | IFile; // TODO: Check this type
    readOnly?: boolean;
    noMargin?: boolean; // defaults to true
    files: Array<IFile>;
    hideInput?: boolean;
    formats?: string;

    createLink(file: IFile): string;
    onAddFiles(fileList: FileList): void;
    onRemoveFile(file: IFile): void;
    onFocus?(): void;
}

/**
 * @ngdoc react
 * @name FileInput
 * @description Component to sattach files as input
 */
export class FileInput extends React.PureComponent<IProps> {
    dom: {
        fileInput: HTMLInputElement | undefined;
        container: React.RefObject<HTMLDivElement>;
    };

    constructor(props) {
        super(props);
        this.dom = {
            fileInput: null,
            container: React.createRef(),
        };
        this.handleKeyDown = this.handleKeyDown.bind(this);
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

    handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.keyCode === KEYCODES.ENTER) {
            this.onBrowseClick();
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
        const {readOnly, onFocus, field, createLink, noMargin = true} = this.props;

        return readOnly ? (
            <Row key={index} noPadding>
                {get(val, 'media') && (
                    <LineInput noMargin={noMargin}>
                        <a
                            href={createLink(val)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {val.media.name}&nbsp;
                        ({Math.round(val.media.length / 1024)}kB)
                        </a>
                    </LineInput>
                )}
            </Row>
        ) : (
            <Row className="file-input" key={index} noPadding>
                {get(val, 'media') && (
                    <LineInput>
                        <a
                            tabIndex={0}
                            className="icn-btn sd-line-input__icon-right"
                            aria-label={gettext('Remove')}
                            onClick={this.onRemove.bind(null, index)}
                        >
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
                                aria-label={gettext('Remove')}
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

    focus() {
        if (this.dom.container.current != null) {
            this.dom.container.current.focus();
        }
    }

    render() {
        const {field, readOnly, onFocus, hideInput, label, formats} = this.props;

        return (
            <Row>
                <Label text={label} />
                {this.getFileItems()}
                {!hideInput && !readOnly && (
                    <div
                        tabIndex={0}
                        ref={this.dom.container}
                        onDrop={this.onDrop}
                        onDragEnter={this.onDragEnter}
                        onDragOver={(e) => e.preventDefault()}
                        className="basic-drag-block"
                        onKeyDown={this.handleKeyDown}
                    >
                        <i className="big-icon--upload-alt" />
                        <span className="basic-drag-block__text">{gettext('Drag files here or') + ' '}</span>
                        <a
                            className="text-link link"
                            onClick={this.onBrowseClick}
                        >
                            &nbsp;{gettext('browse')}
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
                                }}
                            />
                        </a>
                    </div>
                )}
            </Row>
        );
    }
}
