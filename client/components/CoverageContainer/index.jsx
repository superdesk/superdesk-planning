import React from 'react'
import PropTypes from 'prop-types'
import { getCreator } from '../../utils'
import { Coverage, AuditInformation, ItemActionsMenu } from '../index'
import { get } from 'lodash'

export const CoverageContainer = ({
    fieldName,
    index,
    coverage,
    contentTypes,
    users,
    removeCoverage,
    duplicateCoverage,
    readOnly,
    showRemoveAction,
}) => {
    const author = getCreator(coverage, 'original_creator', users)
    const creationDate = get(coverage, '_created')

    const versionCreator = getCreator(coverage, 'version_creator', users)
    const updatedDate = get(coverage, '_updated')

    const duplicateActions = contentTypes
    .filter((contentType) => (
        contentType.qcode !== get(coverage, 'planning.g2_content_type')
    ))
    .map((contentType) => ({
        label: contentType.name,
        callback: () => {duplicateCoverage(index, contentType.qcode)},
    }))

    let itemActions = [
        {
            label: 'Duplicate',
            icon: 'icon-copy',
            callback: () => {duplicateCoverage(index)},
        },
        {
            label: 'Duplicate As',
            icon: 'icon-copy',
            callback: duplicateActions,
        },
    ]

    if (showRemoveAction) {
        itemActions.unshift({
            label: 'Remove coverage',
            icon: 'icon-trash',
            callback: () => {removeCoverage(index)},
        })
    }

    return (
        <div className="Coverage__item">
            <div className="Coverage__item-header">
                <AuditInformation
                    createdBy={author}
                    updatedBy={versionCreator}
                    createdAt={creationDate}
                    updatedAt={updatedDate} />
                { !readOnly && <ItemActionsMenu actions={itemActions}/>}
            </div>
            <Coverage coverage={fieldName} readOnly={readOnly}/>
        </div>
    )
}

CoverageContainer.propTypes = {
    fieldName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    coverage: PropTypes.object.isRequired,
    contentTypes: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    removeCoverage: PropTypes.func.isRequired,
    duplicateCoverage: PropTypes.func.isRequired,
    readOnly: PropTypes.bool.isRequired,
    showRemoveAction: PropTypes.bool.isRequired,
}
