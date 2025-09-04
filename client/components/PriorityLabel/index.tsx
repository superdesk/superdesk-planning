import React from 'react';
import classNames from 'classnames';

import {superdeskApi} from '../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {Tooltip} from 'superdesk-ui-framework';

interface IProps {
    item: {
        priority?: number;
    };
    priorities: Array<{
        name: string;
        qcode: string;
        translations?: {
            name?: {[key: string]: string};
        };
    }>;
    tooltipFlow: 'top' | 'right' | 'down' | 'left';
    inline: boolean;
    className?: string;
}

export class PriorityLabel extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            priorities,
            tooltipFlow = 'right',
            inline,
            className = '',
        } = this.props;

        if (item.priority == null) {
            return null;
        }

        const priority = priorities && priorities.find((p) => p.qcode === item.priority);

        if (!priority) {
            return null;
        }

        const priorityName = getVocabularyItemFieldTranslated(
            priority,
            'name',
            getUserInterfaceLanguageFromCV()
        );
        const tooltip = gettext('Priority: {{ name }}', {name: priorityName});

        return (
            <span
                className={classNames(
                    'priority-label',
                    'priority-label--' + item.priority,
                    {'sd-list-item__inline-icon': inline},
                    className
                )}
            >
                <Tooltip
                    text={tooltip}
                    flow={tooltipFlow}
                >
                    {priority.qcode}
                </Tooltip>
            </span>
        );
    }
}
