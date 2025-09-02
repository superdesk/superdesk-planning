import React from 'react';
import {get} from 'lodash';
import {gettext} from '../../../../utils';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const GenreComponent = ({assignment}: IProps) => {
    const genre = get(assignment, 'planning.genre.name');

    if (!genre) {
        return null;
    }

    return (
        <div className="sd-list-item__element-lm-10">
            <span className="sd-list-item__text-label">
                {gettext('Genre:')}
            </span>
            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                <span>{genre}</span>
            </span>
        </div>
    );
};
