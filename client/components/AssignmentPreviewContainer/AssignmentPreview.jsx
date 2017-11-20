import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import TextareaAutosize from 'react-textarea-autosize'

import { getItemInArrayById } from '../../utils'

// eslint-disable-next-line complexity
export const AssignmentPreview = ({
    assignment,
    keywords,
    contentTypes,
    formProfile,
    coverageItem,
    newsCoverageStatus,
}) => {
    const planning = get(assignment, 'planning', {})

    const coverageStatus = getItemInArrayById(
        newsCoverageStatus,
        get(coverageItem, 'news_coverage_status.qcode', 'qcode')
    ) || 'Planned'

    const keywordString = get(planning, 'keyword.length', 0) > 0 ?
        planning.keyword
            .map((qcode) => get(keywords.find((k) => k.qcode === qcode), 'name') || qcode)
            .join(', ')
        : '-'

    const contentType = get(
            contentTypes.find((ctype) => ctype.qcode === planning.g2_content_type),
            'name'
        ) || planning.g2_content_type || '-'

    return (
        <div>
            {get(formProfile, 'editor.slugline.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Slugline
                    </label>
                    <p className="sd-text__slugline">
                        {planning.slugline || '-'}
                    </p>
                </div>
            }

            {get(formProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Ednote
                    </label>
                    <TextareaAutosize
                        value={planning.ednote || '-'}
                        disabled={true}
                    />
                </div>
            }

            {get(formProfile, 'editor.keyword.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Keywords
                    </label>
                    <div className="terms-list">
                        <p>{keywordString}</p>
                    </div>
                </div>
            }

            {get(formProfile, 'editor.internal_note.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Internal Note
                    </label>
                    <TextareaAutosize
                        value={planning.internal_note || '-'}
                        disabled={true}
                    />
                </div>
            }

            {get(formProfile, 'editor.g2_content_type.enabled') &&
                <div className="form__row form__row--flex">
                    <div className="form__row-item">
                        <label className="form-label form-label--light">
                            Type
                        </label>
                        <p>
                            {contentType}
                        </p>
                    </div>
                    {planning.g2_content_type === 'text' && get(formProfile, 'editor.genre.enabled') &&
                        <div className="form__row-item">
                            <label className="form-label form-label--light">
                                Genre
                            </label>
                            <p>{get(planning, 'genre.name') || '-'}</p>
                        </div>
                    }
                </div>
            }

            <div className="form__row">
                <label className="form-label form-label--light">
                    Coverage Status
                </label>
                <p>
                    {coverageStatus || 'Planned'}
                </p>
            </div>
        </div>
    )
}

AssignmentPreview.propTypes = {
    assignment: PropTypes.object,
    keywords: PropTypes.array,
    contentTypes: PropTypes.array,
    formProfile: PropTypes.object,
    coverageItem: PropTypes.object,
    newsCoverageStatus: PropTypes.array,
}
