import { CoverageContainer } from '../../index'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { arraySplice } from 'redux-form'
import { get } from 'lodash'
import * as selectors from '../../../selectors'
import * as actions from '../../../actions'
import { WORKSPACE } from '../../../constants'

export class CoveragesFieldArrayComponent extends React.Component {
    newCoverage() {
        const { fields, slugline } = this.props
        fields.push({
            planning: { slugline },
            news_coverage_status:  { qcode: 'ncostat:int' },
        })
    }

    removeCoverage(index) {
        const { fields } = this.props
        fields.remove(index)
    }

    duplicateCoverage(index, contentType=null) {
        const { fields } = this.props
        const existingCoverage = fields.get(index)

        if (contentType === null) {
            contentType = existingCoverage.planning.g2_content_type
        }

        fields.push({
            planning: {
                ...existingCoverage.planning,
                g2_content_type: contentType,
            },
            news_coverage_status:  { qcode: 'ncostat:int' },
        })
    }

    cancelCoverage(index) {
        let cancelledCoverage = {
            ...this.props.fields.get(index),
            news_coverage_status:  this.props.cancelCoverageState,
        }

        cancelledCoverage.planning = {
            ...cancelledCoverage.planning,
            internal_note: `------------------------------------------------------------
    Coverage cancelled
    `,
            ednote: `------------------------------------------------------------
    Coverage cancelled
    `,
        }

        this.props.cancelCoverage(index, cancelledCoverage)
    }

    render() {
        const {
            fields,
            readOnly,
            users,
            desks,
            contentTypes,
            currentWorkspace,
            onAddCoverage,
        } = this.props

        const inPlanning = currentWorkspace === WORKSPACE.PLANNING

        return (
            <ul className="Coverage__list">
                {fields.map((fieldName, index) => {
                    const coverage = fields.get(index)
                    return (
                        <li key={index}>
                            <CoverageContainer
                                key={fieldName}
                                fieldName={fieldName}
                                index={index}
                                coverage={coverage}
                                contentTypes={contentTypes}
                                users={users}
                                desks={desks}
                                readOnly={readOnly || (!inPlanning && !!get(coverage, 'coverage_id'))}
                                removeCoverage={this.removeCoverage.bind(this)}
                                duplicateCoverage={this.duplicateCoverage.bind(this)}
                                cancelCoverage={this.cancelCoverage.bind(this)}
                                showRemoveAction={
                                    fields.length > 1 &&
                                    !get(coverage, 'assigned_to.assignment_id') &&
                                    inPlanning
                                }
                            />
                        </li>
                    )
                })}
                <li>
                    { !readOnly && inPlanning && <button
                        className="Coverage__add-btn btn btn-default"
                        onClick={this.newCoverage.bind(this)}
                        type="button">
                        <i className="icon-plus-large"/>
                    </button> }

                    {readOnly && !inPlanning &&
                        <button
                            className="Coverage__add-btn btn btn-default"
                            onClick={onAddCoverage.bind()}
                            type="button">
                            <i className="icon-plus-large"/>
                        </button>
                    }
                </li>
            </ul>
        )
    }
}

CoveragesFieldArrayComponent.propTypes = {
    fields: PropTypes.object,
    readOnly: PropTypes.bool,
    slugline: PropTypes.string,
    users: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    cancelCoverage: PropTypes.func,
    cancelCoverageState: PropTypes.object,
    currentWorkspace: PropTypes.string,
    onAddCoverage: PropTypes.func,
}

CoveragesFieldArrayComponent.defaultProps = {
    slugline: '',
    fields: {},
}

const mapStateToProps = (state) => ({
    contentTypes: selectors.getContentTypes(state),
    cancelCoverageState: selectors.getCoverageCancelState(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
})

const mapDispatchToProps = (dispatch) =>  ({
    cancelCoverage: (index, coverage) =>
        (dispatch(arraySplice('planning', 'coverages', index, 1, coverage))),
    onAddCoverage: () =>
        dispatch(actions.planning.ui.onAddCoverageClick()),
})

export const CoveragesFieldArray = connect(mapStateToProps, mapDispatchToProps)(CoveragesFieldArrayComponent)
