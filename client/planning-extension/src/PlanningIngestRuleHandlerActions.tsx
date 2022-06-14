import * as React from 'react';
import {IIngestRule} from 'superdesk-api';
import {Switch} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';

interface IProps {
    rule: IIngestRule;
    updateRule(rule: IIngestRule): void;
}

export class PlanningIngestRuleHandlerActions extends React.PureComponent<IProps> {
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
                    value={this.props.rule.actions.extra?.autopost == true}
                    onChange={this.updateAutopostValue}
                />
            </div>
        );
    }
}

export class PlanningIngestRuleHandlerActionsPreview extends React.PureComponent<{rule: IIngestRule}> {
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
