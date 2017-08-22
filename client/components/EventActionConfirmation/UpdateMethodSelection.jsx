import React from 'react'
import PropTypes from 'prop-types'
import './style.scss'
import { EventUpdateMethodField } from '../fields/index'
import { Field } from 'redux-form'
import { RelatedEvents, RelatedPlannings } from '../index'

export const UpdateMethodSelection = ({
        showMethodSelection,
        updateMethodLabel,
        relatedPlannings,
        relatedEvents,
        dateFormat,
        action,
        handleSubmit,
    }) => {
    return (
        <div>
            { showMethodSelection &&
            <form onSubmit={handleSubmit}>
                <div className="MethodSelect">
                    <span>
                        <strong>This event is a recurring event!</strong>
                    </span>

                    <Field name="update_method"
                           component={EventUpdateMethodField}
                           label={updateMethodLabel}/>
                </div>

                <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
            </form>}

            { relatedPlannings.length > 0 && (
                <div>
                    <div className="sd-alert sd-alert--hollow sd-alert--alert">
                        <strong>This will also {action} the following planning items</strong>
                        <RelatedPlannings
                            plannings={relatedPlannings}
                            openPlanningItem={true}
                            short={true} />
                    </div>
                </div>
            )}

            { showMethodSelection && relatedEvents.length > 0 && (
                <div>
                    <div className="sd-alert sd-alert--hollow sd-alert--alert">
                        <strong>This will also {action} the following events</strong>
                        <RelatedEvents
                            events={relatedEvents}
                            dateFormat={dateFormat} />
                    </div>
                </div>
            )}

            { showMethodSelection && relatedPlannings.length === 0 && relatedEvents.length === 0 && (
                <div className="spacing" />
            )}
        </div>
    )
}

UpdateMethodSelection.defaultProps = {
    relatedPlannings: [],
    relatedEvents: [],
    action: 'affect',
}

UpdateMethodSelection.propTypes = {
    showMethodSelection: PropTypes.bool,
    updateMethodLabel: PropTypes.string,
    relatedPlannings: PropTypes.array,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string,
    action: PropTypes.string,
    handleSubmit: PropTypes.func.isRequired,
}
