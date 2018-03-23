import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import classNames from 'classnames';

import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {gettext} from '../../utils';

import './style.scss';

export const InternalNoteLabel = ({item, prefix, showTooltip, marginRight, marginLeft}) => {
    const internalNote = get(item, `${prefix}internal_note`);

    if (get(internalNote, 'length', 0) < 1) {
        return null;
    }

    return !showTooltip ? (
        <i className={classNames(
            'internal-note__label',
            'icon-info-sign',
            'icon--red',
            {
                'internal-note__label--margin-right': marginRight,
                'internal-note__label--margin-left': marginLeft,
            }
        )} />
    ) : (
        <OverlayTrigger
            overlay={
                <Tooltip id="internal_note_popup">
                    {gettext('Internal Note:')}
                    <br/>
                    {internalNote
                        .split('\n')
                        .map((item, key) => <span key={key}>{item}<br/></span>)
                    }
                </Tooltip>
            }
        >
            <i className={classNames(
                'internal-note__label',
                'icon-info-sign',
                'icon--red',
                {
                    'internal-note__label--margin-right': marginRight,
                    'internal-note__label--margin-left': marginLeft,
                }
            )} />
        </OverlayTrigger>
    );
};

InternalNoteLabel.propTypes = {
    item: PropTypes.object,
    prefix: PropTypes.string,
    showTooltip: PropTypes.bool,
    marginRight: PropTypes.bool,
    marginLeft: PropTypes.bool,
};

InternalNoteLabel.defaultProps = {
    prefix: '',
    showTooltip: true,
    marginRight: true,
    marginLeft: false,
};
