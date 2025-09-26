import React from 'react';
import {get} from 'lodash';
import classNames from 'classnames';
import {Popover} from 'superdesk-ui-framework/react';
import {gettext, getItemWorkflowStateLabel} from '../../utils';

import './style.scss';

interface IInternalNoteLabelProps {
    item: any;
    noteField?: string;
    prefix?: string;
    showTooltip?: boolean;
    marginRight?: boolean;
    marginLeft?: boolean;
    showText?: boolean;
    stateField?: string;
    className?: string;
    showHeaderText?: boolean;
}

export const InternalNoteLabel: React.FC<IInternalNoteLabelProps> = ({
    item,
    noteField = 'internal_note',
    showText,
    stateField,
    className,
    prefix = '',
    showTooltip = true,
    marginRight = false,
    marginLeft = false,
    showHeaderText = true,
}) => {
    const internalNote = get(item, `${prefix}${noteField}`);

    if ((internalNote ?? '').length < 1) {
        return null;
    }

    const iconColor = stateField ? get(getItemWorkflowStateLabel(item, stateField), 'iconType') : 'red';

    const icon = (
        <i
            id="internal-note-icon"
            className={classNames(
                'internal-note__label',
                'icon-info-sign',
                `icon--${iconColor}`,
                {
                    'internal-note__label--margin-right': marginRight,
                    'internal-note__label--margin-left': marginLeft,
                }
            )}
        />
    );

    if (!showTooltip) {
        return (
            <div className={className}>
                {icon}
                {showText && internalNote}
            </div>
        );
    }

    return (
        <>
            <Popover
                placement="auto"
                triggerSelector="#internal-note-icon"
                title={showHeaderText ? gettext('Internal Note:') : ''}
            >
                {internalNote}
            </Popover>
            {icon}
        </>
    );
};
