import React from 'react';
import classNames from 'classnames';

import {getUserInterfaceLanguage} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

interface IProps {
    item: {
        priority?: string;
    };
    priorities: Array<{
        name: string;
        qcode: string;
        translations?: {
            name?: {[key: string]: string};
        };
    }>;
    tooltipFlow: 'up' | 'right' | 'down' | 'left';
    inline: boolean;
    className: string;
}

export class PriorityLabel extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            priorities,
            tooltipFlow = 'right',
            inline,
            className,
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
            getUserInterfaceLanguage()
        );

        return (
            <span
                className={classNames(
                    'priority-label',
                    'priority-label--' + item.priority,
                    {'sd-list-item__inline-icon': inline},
                    className
                )}
                data-sd-tooltip={gettext('Priority: {{ name }}', {name: priorityName})}
                data-flow={tooltipFlow}
            >
                {priority.qcode}
            </span>
        );
    }
}
