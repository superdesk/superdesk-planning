import React from 'react'
import { Field } from 'redux-form'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'

const FileFieldComponent = ({ onRemove, file, createLink, fieldName, readOnly }) => (
    <li className="File__item">
        <i className="icon-desk-attach"/>
        {file.media &&
            <a href={createLink(file)} target="_blank">
                {file.media.name}&nbsp;
                ({Math.round(file.media.length / 1024)}kB)
            </a>
        }
        {!file.media &&
            <Field
            name={fieldName}
            component="input"
            type="file"/>
        }
        {!readOnly && (<button
            onClick={onRemove}
            title="Remove file"
            type="button"
            className="File__remove">
            <i className="icon-trash" />
        </button>)}
    </li>
)

FileFieldComponent.propTypes = {
    onRemove: React.PropTypes.func,
    createLink: React.PropTypes.func.isRequired,
    file: React.PropTypes.oneOfType([
        React.PropTypes.instanceOf(FileList),
        React.PropTypes.array, // in unit test we cannot instanciate FileList
        React.PropTypes.shape({
            media: React.PropTypes.object,
            filemeta: React.PropTypes.object,
        }),
    ]),
    fieldName: React.PropTypes.string,
    readOnly: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({ createLink: (f) => (selectors.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw') })

export const FileField = connect(mapStateToProps)(FileFieldComponent)
