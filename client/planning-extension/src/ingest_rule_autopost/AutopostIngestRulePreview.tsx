import * as React from 'react';
import {IIngestRuleHandlerPreviewProps} from 'superdesk-api';
import {superdesk} from '../superdesk';

type IProps = IIngestRuleHandlerPreviewProps<{autopost: boolean}>;

export class AutopostIngestRulePreview extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdesk.localization;

        return (
            <div className="list-row">
                <span className="text-label text-label--auto">
                    {gettext('Post Items')}:
                </span>
                <span className="list-row__item">
                    {this.props.rule.actions.extra?.autopost === true ?
                        gettext('On') :
                        gettext('Off')
                    }
                </span>
            </div>
        );
    }
}
