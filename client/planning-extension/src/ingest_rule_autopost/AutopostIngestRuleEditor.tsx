import * as React from 'react';
import {IIngestRuleHandlerEditorProps} from 'superdesk-api';
import {Switch} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';

type IProps = IIngestRuleHandlerEditorProps<{autopost: boolean}>;

export class AutopostIngestRuleEditor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.updateAutopostValue = this.updateAutopostValue.bind(this);
    }

    updateAutopostValue(value: boolean) {
        this.props.updateRule({
            ...this.props.rule,
            actions: {
                ...this.props.rule.actions,
                extra: {
                    ...this.props.rule.actions.extra ?? {},
                    autopost: value,
                },
            },
        });
    }

    render() {
        const {gettext} = superdesk.localization;

        return (
            <div>
                <Switch
                    label={{text: gettext('Post Items')}}
                    value={this.props.rule.actions.extra?.autopost === true}
                    onChange={this.updateAutopostValue}
                />
            </div>
        );
    }
}
