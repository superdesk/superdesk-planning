import React from 'react'
import './style.scss'

export const RelatedPlannings = ({ plannings, onPlanningClick }) => (
    <ul className="related-plannings">
        {plannings.map(({
            _id,
            slugline,
            anpa_category,
            _agenda,
            original_creator: { display_name },
        }) => (
            <li key={_id}>
                <i className="icon-list-alt"/>&nbsp;
                <a onClick={onPlanningClick.bind(null, _id)}>
                    {slugline} by {display_name} in {_agenda.name} agenda
                    {anpa_category && anpa_category.length && (
                        <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                    )}
                </a>
            </li>
        ))}
    </ul>
)

RelatedPlannings.propTypes = {
    plannings: React.PropTypes.array.isRequired,
    onPlanningClick: React.PropTypes.func.isRequired,
}
