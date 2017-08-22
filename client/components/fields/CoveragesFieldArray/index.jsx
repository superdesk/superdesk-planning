import { CoverageContainer } from '../../index'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import './style.scss'

export class CoveragesFieldArrayComponent extends React.Component {
    newCoverage() {
        const { fields, headline, slugline } = this.props
        fields.push({
            planning: {
                headline,
                slugline,
            },
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
                assigned_to: null,
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
            contentTypes,
        } = this.props

        return (
            <ul className="Coverage__list">
                {fields.map((fieldName, index) => (
                    <CoverageContainer
                        key={fieldName}
                        fieldName={fieldName}
                        index={index}
                        coverage={fields.get(index)}
                        contentTypes={contentTypes}
                        users={users}
                        readOnly={readOnly}
                        removeCoverage={this.removeCoverage.bind(this)}
                        duplicateCoverage={this.duplicateCoverage.bind(this)}
                        showRemoveAction={fields.length > 1}
                    />
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
    fields: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    headline: PropTypes.string,
    slugline: PropTypes.string,
    users: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
}

CoveragesFieldArrayComponent.defaultProps = {
    headline: '',
    slugline: '',
}

const mapStateToProps = (state) => ({ contentTypes: state.vocabularies.g2_content_type })

export const CoveragesFieldArray = connect(mapStateToProps)(CoveragesFieldArrayComponent)
