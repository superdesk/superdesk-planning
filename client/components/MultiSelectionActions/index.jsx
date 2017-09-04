import React from 'react'
import PropTypes from 'prop-types'
import { gettext } from '../../utils'
import './style.scss'

function MultiPlanningSelectionActions(props) {
    const {
        selectAll,
        deselectAll,
        actions,
    } = props

    const stopEvent = (callback) =>
        (event) => {
            event.preventDefault()
            callback()
        }

    const trigger = (action) =>
        () => action.run()

    const buttons = actions.map((action) => {
        const className = 'btn btn--' + (action.btn ? action.btn : 'primary')

        return (
            <button
                key={action.name}
                onClick={trigger(action)}
                className={className}
                >{action.name}
            </button>
        )
    })

    return (
        <div className="MultiSelectionActions">
            <div className="MultiSelectionActions__info">
                {gettext('{{ count }} selected', { count: props.selected.length })}&nbsp;
                <a href onClick={stopEvent(selectAll)}>{gettext('select all')}</a>
                &nbsp;/&nbsp;
                <a href onClick={stopEvent(deselectAll)}>{gettext('deselect')}</a>
            </div>

            <div className="MultiSelectionActions__actions">
                {buttons}
            </div>
        </div>
    )
}

MultiPlanningSelectionActions.propTypes = {
    actions: PropTypes.array.isRequired,
    selected: PropTypes.array.isRequired,
    selectAll: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
}

export default MultiPlanningSelectionActions
