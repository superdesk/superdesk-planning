import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-textarea-autosize';

import {get, keyBy} from 'lodash';
import {UrgencyLabel, Label} from '../../components';
import {AgendaNameList} from '../Agendas';

export const PlanningPreview = ({urgencyLabel, item, formProfile, agendas, urgencies}) => {
    const agendaMap = keyBy(agendas, '_id');
    const agendaAssigned = (get(item, 'agendas') || []).map((agendaId) => get(agendaMap, agendaId));

    return (
        <div>
            {get(formProfile, 'editor.agendas.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                       Agenda
                    </label>
                    {agendaAssigned.length &&
                        <AgendaNameList agendas={agendaAssigned}/>
                    ||
                        <p>-</p>
                    }
                </div>
            }

            {get(formProfile, 'editor.slugline.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Slugline
                    </label>
                    <p className="sd-text__slugline">
                        {item.slugline || '-'}
                    </p>
                </div>
            }

            {get(formProfile, 'editor.description.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Description
                    </label>
                    <TextareaAutosize
                        value={item.description_text || '-'}
                        disabled={true} />
                </div>
            }

            {get(formProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Ed Note
                    </label>

                    <TextareaAutosize
                        value={item.ednote || '-'}
                        disabled={true}
                    />
                </div>
            }

            {get(formProfile, 'editor.internal_note.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        Internal Note
                    </label>

                    <TextareaAutosize
                        value={item.internal_note || '-'}
                        disabled={true}
                    />
                </div>
            }

            {get(formProfile, 'editor.urgency.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {urgencyLabel}
                    </label>
                    {get(item, 'urgency') &&
                        <UrgencyLabel
                            item={item}
                            urgencies={urgencies}
                            label={urgencyLabel}
                        />
                    ||
                        <p>-</p>
                    }
                </div>
            }

            {get(formProfile, 'editor.flags') &&
                get(item, 'flags.marked_for_not_publication', false) &&
                <div className="form__row">
                    <Label text="Not For Publication" iconType="alert"/>
                </div>
            }
        </div>
    );
};

PlanningPreview.propTypes = {
    urgencyLabel: PropTypes.string,
    item: PropTypes.object,
    formProfile: PropTypes.object,
    agendas: PropTypes.array,
    urgencies: PropTypes.array,
};
