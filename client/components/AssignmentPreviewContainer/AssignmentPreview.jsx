import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';

import {TermsList} from '../TermsList/index';

// eslint-disable-next-line complexity
export const AssignmentPreview = ({
    assignment,
    keywords,
    coverageFormProfile,
    planningFormProfile,
    planningItem,

}) => {
    const planning = get(assignment, 'planning', {});

    const keywordString = get(planning, 'keyword.length', 0) > 0 ?
        planning.keyword
            .map((qcode) => get(keywords.find((k) => k.qcode === qcode), 'name') || qcode)
            .join(', ')
        : '-';

    return (
        <div>
            {get(coverageFormProfile, 'editor.slugline.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Slugline
                    </label>
                    <p className="sd-text__slugline">
                        {planning.slugline || '-'}
                    </p>
                </div>
            }

            {get(planningFormProfile, 'editor.anpa_category.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Category
                    </label>
                    <div>
                        {get(planningItem, 'anpa_category.length', 0) > 0 &&
                            <TermsList terms={get(planningItem, 'anpa_category')} displayField="name"/>
                        ||
                            <p>-</p>
                        }
                    </div>
                </div>
            }

            {get(planningFormProfile, 'editor.subject.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Subject
                    </label>
                    <div>
                        {get(planningItem, 'subject.length', 0) > 0 &&
                            <TermsList terms={get(planningItem, 'subject')} displayField="name"/>
                        ||
                            <p>-</p>
                        }
                    </div>
                </div>
            }

            {get(coverageFormProfile, 'editor.genre.enabled') &&
                <div className="form__row">
                    <div className="form__row-item">
                        <label className="form-label form-label--light">
                            Genre
                        </label>
                        <p>{get(planning, 'genre.name') || '-'}</p>
                    </div>
                </div>
            }

            {get(coverageFormProfile, 'editor.keyword.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Keywords
                    </label>
                    <div className="terms-list">
                        <p>{keywordString}</p>
                    </div>
                </div>
            }

            {get(coverageFormProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Ed Note
                    </label>
                    <TextareaAutosize
                        value={planning.ednote || '-'}
                        disabled={true}
                    />
                </div>
            }


            {get(coverageFormProfile, 'editor.internal_note.enabled') &&
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
        </div>
    );
};

AssignmentPreview.propTypes = {
    assignment: PropTypes.object,
    keywords: PropTypes.array,
    coverageFormProfile: PropTypes.object,
    planningFormProfile: PropTypes.object,
    planningItem: PropTypes.object,
};
