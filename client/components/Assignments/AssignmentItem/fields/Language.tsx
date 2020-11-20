import React from 'react';
import {superdeskApi} from '../../../../superdeskApi';
import {IAssignmentItem} from '../../../../interfaces';

interface IProps {
    assignment: IAssignmentItem;
}

export const LanguageComponent = ({assignment}: IProps) => {
    const {gettext} = superdeskApi.localization;
    const language = assignment.planning?.language;

    if (!language) {
        return null;
    }

    return (
        <div className="sd-list-item__element-lm-10">
            <span className="sd-list-item__text-label">
                {gettext('Language:')}
            </span>
            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                <span>{language}</span>
            </span>
        </div>
    );
};
