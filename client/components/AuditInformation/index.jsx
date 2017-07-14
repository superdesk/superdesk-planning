import React from 'react'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import { get } from 'lodash'
import moment from 'moment'

export const AuditInformationComponent = ({
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    users,
}) => {

    const creator = get(createdBy, 'display_name') ? createdBy : users.find((user) => user._id === createdBy)
    const versionCreator = get(updatedBy, 'display_name') ? updatedBy : users.find((user) => user._id === updatedBy)
    const createdDateTime = createdAt ? moment(createdAt).fromNow() : null
    const modifiedDateTime = updatedAt ? moment(updatedAt).fromNow() : null

    return (
        <div className="TimeAndAuthor">
            {createdDateTime && creator &&
                <div>Created {createdDateTime} by <span className='TimeAndAuthor__author'> {creator.display_name}</span></div>
            }
            {modifiedDateTime && versionCreator &&
                <div>Updated {modifiedDateTime} by <span className='TimeAndAuthor__author'> {versionCreator.display_name}</span></div>
            }
        </div>
    )
}

AuditInformationComponent.propTypes = {
    users: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.object,
    ]),
    createdBy:React.PropTypes.any,
    createdAt:React.PropTypes.any,
    updatedBy:React.PropTypes.any,
    updatedAt:React.PropTypes.any,
}

const mapStateToProps = (state) => ({ users: selectors.getUsers(state) })

export const AuditInformation = connect(mapStateToProps)(AuditInformationComponent)