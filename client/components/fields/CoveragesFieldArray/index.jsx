import { CoverageContainer } from '../../index'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'

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

    render() {
        const {
            fields,
            readOnly,
            users,
            desks,
            contentTypes,
        } = this.props

        return (
            <ul className="Coverage__list">
                {fields.map((fieldName, index) => (
                    <li key={index}>
                        <CoverageContainer
                            key={fieldName}
                            fieldName={fieldName}
                            index={index}
                            coverage={fields.get(index)}
                            contentTypes={contentTypes}
                            users={users}
                            desks={desks}
                            readOnly={readOnly}
                            removeCoverage={this.removeCoverage.bind(this)}
                            duplicateCoverage={this.duplicateCoverage.bind(this)}
                            showRemoveAction={fields.length > 1 &&
                            !get(fields.get(index), 'assigned_to.assignment_id')}
                        />
                    </li>
                ))}
                <li>
                    { !readOnly && <button
                        className="Coverage__add-btn btn btn-default"
                        onClick={this.newCoverage.bind(this)}
                        type="button">
                        <i className="icon-plus-large"/>
                    </button> }
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
}

CoveragesFieldArrayComponent.defaultProps = {
    slugline: '',
    fields: {},
}

const mapStateToProps = (state) => ({ contentTypes: state.vocabularies.g2_content_type })

export const CoveragesFieldArray = connect(mapStateToProps)(CoveragesFieldArrayComponent)
