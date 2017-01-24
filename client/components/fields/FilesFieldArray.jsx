import React from 'react'
import { Field } from 'redux-form'
import { connect } from 'react-redux'

const FilesFieldArrayComponent = ({ fields, createLink }) => (
    <ul className="File__list">
        {fields.map((file, index) => (
            <li key={index} className="File__item">
                <button
                    onClick={()=>fields.remove(index)}
                    title="Remove file"
                    type="button"
                    className="File__remove">
                    <i className="icon-trash" />
                </button>
                {fields.get(index).media &&
                    <a href={createLink(fields.get(index))}>
                        {fields.get(index).media.name}&nbsp;
                        ({Math.round(fields.get(index).media.length / 1024)}kB)
                    </a>
                }
                {!fields.get(index).media &&
                    <Field
                    name={file}
                    component="input"
                    type="file"/>
                }
            </li>
        ))}
        <li>
            <button
                className="File__add-btn btn btn-default"
                onClick={() => fields.push({})}
                type="button">
                Add a file
            </button>
        </li>
    </ul>
)
FilesFieldArrayComponent.propTypes = {
    fields: React.PropTypes.object.isRequired,
    createLink: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
    createLink: (a) => (state.config.server.url + '/upload/' + a.filemeta.media_id + '/raw')
})

export const FilesFieldArray = connect(mapStateToProps)(FilesFieldArrayComponent)
