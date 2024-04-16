import React from 'react';
import classNames from 'classnames';

import {superdeskApi} from '../../../superdeskApi';

import {Button} from '../index';
import './style.scss';

interface IProps {
    hide: boolean;
    onCancel: () => void;
    innerInfo: string;
    innerTools: React.ReactNode;
    tools: React.ReactNode;
    rightCancelButton?: boolean;
    cancelText?: string;
    bulkAddToWorkflow: () => void;
}

/**
 * @ngdoc react
 * @name SlidingToolBar
 * @description Top sliding toolbar of a Sub Nav bar
 */
export const SlidingToolBar = ({
    hide,
    innerInfo,
    innerTools,
    tools,
    onCancel,
    rightCancelButton,
    cancelText,
}: IProps) => {
    const {gettext} = superdeskApi.localization;
    const hideDefault = hide ?? true;

    return (
        <div
            className={classNames(
                'subnav__sliding-toolbar',
                {'ng-hide': hideDefault})}
        >
            <div className="sliding-toolbar__inner">
                {!rightCancelButton && <Button onClick={onCancel} text={gettext('Cancel')} />}
                <span className="sliding-toolbar__info-text">{innerInfo}&nbsp;</span>
                <span className="sliding-toolbar__info-tools">{innerTools}</span>
            </div>
            {tools}
            {rightCancelButton && <Button onClick={onCancel} text={cancelText || gettext('Cancel')} />}
        </div>
    );
};

