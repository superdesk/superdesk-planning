import React from 'react';
import {get} from 'lodash';
import classNames from 'classnames';
import {Text, Tooltip} from 'superdesk-ui-framework/react';
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
    const internalNoteRaw = get(item, `${prefix}${noteField}`);

    if ((internalNoteRaw ?? '').length < 1) {
        return null;
    }

    // Strip out any existing HTML tags and convert \n to <br> tags for HTML rendering
    const internalNoteHtml = internalNoteRaw
        .replace(/<[^>]*>/g, '')
        .split('\n')
        .map((line) => line)
        .join('<br>');

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
                {showText && <span dangerouslySetInnerHTML={{__html: internalNoteHtml}} />}
            </div>
        );
    }

    return (
        <>
            <Tooltip
                placement="auto"
                content={() => (
                    <div>
                        {showHeaderText && <Text weight="strong">{gettext('Internal Note:')}</Text>}
                        <div dangerouslySetInnerHTML={{__html: internalNoteHtml}} />
                    </div>
                )}
            >
                {icon}
            </Tooltip>
        </>
    );
};
