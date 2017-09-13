import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import * as actions from '../../actions'
import { AuditInformation, Coverage } from '../../components'
import * as selectors from '../../selectors'
import { TOOLTIPS } from '../../constants'
import { getCreator } from '../../utils'
import classNames from 'classnames'
import { get } from 'lodash'
import './style.scss'

export class EditAssignment extends React.Component {

    handleSubmit() {

    }

    render() {
        const {
            assignment,
            readOnly,
            users,
            closePreviewAssignment,
        } = this.props

        const creationDate = get(assignment, '_created')
        const updatedDate = get(assignment, '_updated')

        const author = getCreator(assignment, 'original_creator', users)
        const versionCreator = getCreator(assignment, 'version_creator', users)

        return (
            <div className="EditAssignmentPanel">
                <header>
                    <div className={classNames('TimeAndAuthor',
                        'dropdown',
                        'dropdown--drop-right',
                        'pull-left')}>
                        <AuditInformation
                            createdBy={author}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate} />
                    </div>
                    <div className="EditAssignmentPanel__actions">
                        <button className="EditAssignmentPanel__actions__edit"
                            onClick={closePreviewAssignment.bind(null, null)}
                            data-sd-tooltip={TOOLTIPS.close} data-flow='down'>
                            <i className="icon-close-small"/>
                        </button>
                    </div>
                </header>

                <div className="EditAssignmentPanel__body">
                    <form onSubmit={this.handleSubmit}>
                        <div>
                            <Coverage coverage={'assignment'} readOnly={readOnly}/>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

EditAssignment.propTypes = {
    assignment: PropTypes.object,
    readOnly: PropTypes.bool,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    closePreviewAssignment: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
    initialValues: { assignment: selectors.getCurrentAssignment(state) },
    assignment: selectors.getCurrentAssignment(state),
    users: selectors.getUsers(state),
    readOnly: selectors.getReadOnlyAssignment(state),
})

const mapDispatchToProps = (dispatch) => (
    { closePreviewAssignment: () => dispatch(actions.closePreviewAssignment()) }
)

export const EditAssignmentContainer = connect(
    mapStateToProps, mapDispatchToProps
)(reduxForm({
    form: 'assignment',
    enableReinitialize: true,
})(EditAssignment))
