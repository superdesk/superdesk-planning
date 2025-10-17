import React from 'react';
import {get} from 'lodash';
import classNames from 'classnames';
import {Text, Tooltip} from 'superdesk-ui-framework/react';
import {gettext, getItemWorkflowStateLabel} from '../../utils';
import {stripHtmlTags} from 'superdesk-core/scripts/core/utils';

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
                {showText && internalNoteRaw}
            </div>
        );
    }

    const contentParsed = stripHtmlTags(internalNoteRaw).split('\n')
        .map((x, i) => <p key={i}>{x}</p>);

    return (
        <Tooltip
            placement="auto"
            content={() => (
                <div
                    style={{
                        boxShadow: 'var(--sd-shadow--z3)',
                        padding: 'var(--space--1-5)',
                        fontSize: 'var(--text-size-small)',
                        lineHeight: 1.4
                    }}
                >
                    {showHeaderText && <Text weight="strong">{gettext('Internal Note:')}</Text>}
                    {contentParsed}
                </div>
            )}
        >
            {icon}
        </Tooltip>
    );
};
