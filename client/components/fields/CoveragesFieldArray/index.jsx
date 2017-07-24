import { Coverage, AuditInformation } from '../../index'
import { getCreator } from '../../../utils'
import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import './style.scss'

export const CoveragesFieldArray = ({ fields, readOnly, headline, slugline, users }) => (
    <ul className="Coverage__list">
        {fields.map((coverage, index) => {
            const c = fields.get(index)

            const author = getCreator(c, 'original_creator', users)
            const creationDate = get(c, '_created')

            const versionCreator = getCreator(c, 'version_creator', users)
            const updatedDate = get(c, '_updated')

            return (
                <li key={index} className="Coverage__item">
                    <div className="Coverage__item-header">
                        <AuditInformation
                            createdBy={author}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate} />
                        { !readOnly && <button
                            onClick={() => fields.remove(index)}
                            title="Remove coverage"
                            type="button"
                            className="Coverage__remove">
                            <i className="icon-trash"/>
                        </button> }
                    </div>
                    <Coverage coverage={coverage} readOnly={readOnly}/>
                </li>
            )
        })}
        <li>
            { !readOnly && <button
                className="Coverage__add-btn btn btn-default"
                onClick={() => fields.push({
                    planning: {
                        headline,
                        slugline,
                    },
                })}
                type="button" >
                <i className="icon-plus-large"/>
            </button> }
        </li>
    </ul>
)

CoveragesFieldArray.propTypes = {
    fields: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    headline: PropTypes.string,
    slugline: PropTypes.string,
    users: PropTypes.array.isRequired,
}

CoveragesFieldArray.defaultProps = {
    headline: '',
    slugline: '',
}
