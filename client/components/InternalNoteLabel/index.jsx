import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import classNames from 'classnames';

import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {gettext, getItemWorkflowStateLabel} from '../../utils';

import './style.scss';

export const InternalNoteLabel = ({
    item,
    noteField,
    prefix,
    showTooltip,
    marginRight,
    marginLeft,
    showText,
    stateField,
    className,
    showHeaderText,
}) => {
    const internalNote = get(item, `${prefix}${noteField}`);
    const iconColor = stateField ? get(getItemWorkflowStateLabel(item, stateField), 'iconType') : 'red';

    if (get(internalNote, 'length', 0) < 1) {
        return null;
    }

    return !showTooltip ? (
        <div className={className}>
            <i
                className={classNames(
                    'internal-note__label',
                    'icon-info-sign',
                    `icon--${iconColor}`,
                    {
                        'internal-note__label--margin-right': marginRight,
                        'internal-note__label--margin-left': marginLeft,
                    }
                )}
            />{showText && internalNote}</div>
    ) : (
        <OverlayTrigger
            overlay={(
                <Tooltip id="internal_note_popup" className="tooltip--text-left">
                    {showHeaderText && gettext('Internal Note:')}
                    {showHeaderText && <br />}
                    {internalNote
                        .split('\n')
                        .map((item, key) => <span key={key}>{item}<br /></span>)
                    }
                </Tooltip>
            )}
        >
            <i
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
        </OverlayTrigger>
    );
};

InternalNoteLabel.propTypes = {
    item: PropTypes.object,
    prefix: PropTypes.string,
    field: PropTypes.string,
    className: PropTypes.string,
    showHeaderText: PropTypes.bool,
    showTooltip: PropTypes.bool,
    marginRight: PropTypes.bool,
    marginLeft: PropTypes.bool,
    noteField: PropTypes.string,
    showText: PropTypes.bool,
    stateField: PropTypes.string,
};

InternalNoteLabel.defaultProps = {
    prefix: '',
    showTooltip: true,
    marginRight: true,
    marginLeft: false,
    noteField: 'internal_note',
    showHeaderText: true,
};
