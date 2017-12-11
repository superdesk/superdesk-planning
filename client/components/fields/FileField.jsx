import React from 'react';
import PropTypes from 'prop-types';
import {Field} from 'redux-form';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {FileInputField} from './FileInputField';

const FileFieldComponent = ({onRemove, file, createLink, fieldName, readOnly}) => (
    <li className="File__item">
        {file.media &&
            <a href={createLink(file)} target="_blank">
                {file.media.name}&nbsp;
                ({Math.round(file.media.length / 1024)}kB)
            </a>
        }
        {!file.media && !readOnly &&
            <Field
                name={fieldName}
                component={FileInputField}
            />
        }
        {!readOnly && (<button
            onClick={onRemove}
            title="Remove file"
            type="button"
            className="File__remove">
            <i className="icon-trash" />
        </button>)}
    </li>
);

FileFieldComponent.propTypes = {
    onRemove: PropTypes.func,
    createLink: PropTypes.func.isRequired,
    file: PropTypes.oneOfType([
        PropTypes.instanceOf(FileList),
        PropTypes.array, // in unit test we cannot instanciate FileList
        PropTypes.shape({
            media: PropTypes.object,
            filemeta: PropTypes.object,
        }),
    ]),
    fieldName: PropTypes.string,
    readOnly: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    createLink: (f) => (selectors.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw')
});

export const FileField = connect(mapStateToProps)(FileFieldComponent);
