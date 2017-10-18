import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { getCreator } from '../../utils'
import { planningUtils } from '../../utils'
import { Coverage, AuditInformation, ItemActionsMenu, CoverageListItem } from '../index'
import { get } from 'lodash'


export class CoverageContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = { displayForm: get(this.props, 'coverage.coverage_id') ? false : true }
        this.handleClick = this.handleClick.bind(this)
        this.scrollToView = this.scrollToView.bind(this)
    }

    handleClick() {
        this.setState((prevState) => ({ displayForm: !prevState.displayForm }))
    }

    scrollToView() {
        if (this.state.displayForm) {
            const node = ReactDOM.findDOMNode(this)
            if (node) {
                node.scrollIntoView()
            }
        }
    }

    componentDidMount() {
        this.scrollToView()
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.displayForm && this.state.displayForm) {
            this.scrollToView()
        }
    }

    render() {
        const {
            fieldName,
            index,
            coverage,
            contentTypes,
            users,
            removeCoverage,
            duplicateCoverage,
            cancelCoverage,
            readOnly,
            showRemoveAction,
            desks,
        } = this.props

        const author = getCreator(coverage, 'original_creator', users)
        const creationDate = get(coverage, '_created')

        const versionCreator = getCreator(coverage, 'version_creator', users)
        const updatedDate = get(coverage, '_updated')

        const coverageCancelled = planningUtils.isCoverageCancelled(coverage)

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

        if (!coverageCancelled) {
            itemActions.unshift({
                label: 'Cancel coverage',
                icon: 'icon-close-small',
                callback: () => {cancelCoverage(index)},
            })
        }

        if (showRemoveAction) {
            itemActions.unshift({
                label: 'Remove coverage',
                icon: 'icon-trash',
                callback: () => {removeCoverage(index)},
            })
        }

        return (
            <div>
                {!this.state.displayForm &&
                    <CoverageListItem
                        coverage={coverage}
                        users={users}
                        desks={desks}
                        onClick={this.handleClick}
                        actions={itemActions} readOnly={readOnly}
                    />
                }
                {this.state.displayForm &&
                    <div className="Coverage__item">
                        <div className="Coverage__item-header">
                            <AuditInformation
                                createdBy={author}
                                updatedBy={versionCreator}
                                createdAt={creationDate}
                                updatedAt={updatedDate}/>
                            {!readOnly && <ItemActionsMenu actions={itemActions}/>}
                            <button className="icn-btn pull-right Coverage__item--btn-close" onClick={this.handleClick}>
                                <i className="icon-close-small"/>
                            </button>
                        </div>
                        <Coverage coverage={fieldName} readOnly={readOnly || !planningUtils.canEditCoverage(coverage)}/>
                    </div>
                }
            </div>
        )
    }
}

CoverageContainer.propTypes = {
    fieldName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    coverage: PropTypes.object.isRequired,
    contentTypes: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    removeCoverage: PropTypes.func.isRequired,
    duplicateCoverage: PropTypes.func.isRequired,
    cancelCoverage: PropTypes.func,
    readOnly: PropTypes.bool.isRequired,
    showRemoveAction: PropTypes.bool.isRequired,
}
