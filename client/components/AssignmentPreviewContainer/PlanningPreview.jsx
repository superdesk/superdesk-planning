import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'

export const PlanningPreview = ({ urgencyLabel, urgencies, item, formProfile }) => (
    <div>
        {get(formProfile, 'editor.urgency.enabled') &&
            <div className="form__row">
                <label className="form-label form-label--light">
                    {urgencyLabel}
                </label>
                {get(item, 'urgency') &&
                    <p>
                        {urgencies.find((u) => u.qcode === item.urgency).name || item.urgency}
                    </p>
                ||
                    <p>-</p>
                }
            </div>
        }

        {get(formProfile, 'editor.description.enabled') &&
            <div className="form__row">
                <label className="form-label form-label--light">
                    Description
                </label>
                <p>
                    {item.description_text || '-'}
                </p>
            </div>
        }

        {get(formProfile, 'editor.anpa_category.enabled') &&
            <div className="form__row">
                <label className="form-label form-label--light">
                    Category
                </label>
                <div className="terms-list">
                    {get(item, 'anpa_category.length', 0) > 0 &&
                        <p>{item.anpa_category.map((v) => v.name).join(', ')}</p>
                    ||
                        <p>-</p>
                    }
                </div>
            </div>
        }

        {get(formProfile, 'editor.subject.enabled') &&
            <div className="form__row">
                <label className="form-label form-label--light">
                    Subject
                </label>
                <div className="terms-list">
                    {get(item, 'subject.length', 0) > 0 &&
                        <p>{item.subject.map((v) => v.name).join(', ')}</p>
                    ||
                        <p>-</p>
                    }
                </div>
            </div>
        }
    </div>
)

PlanningPreview.propTypes = {
    urgencyLabel: PropTypes.string,
    urgencies: PropTypes.array,
    item: PropTypes.object,
    formProfile: PropTypes.object,
}
