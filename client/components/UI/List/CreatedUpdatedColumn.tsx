import * as React from 'react';

import {appConfig} from 'appConfig';
import {IEventOrPlanningItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Column} from './Column';
import {Row} from './Row';

interface IProps {
    item: IEventOrPlanningItem;
}

export class CreatedUpdatedColumn extends React.PureComponent<IProps> {
    render() {
        const {gettext, longFormatDateTime, getRelativeOrAbsoluteDateTime} = superdeskApi.localization;
        const datetimeFormat = appConfig.view.dateformat + ' @ ' + appConfig.view.timeformat;

        return (
            <Column>
                <Row>
                    <time
                        title={longFormatDateTime(this.props.item._created)}
                        style={{minWidth: '170px'}}
                    >
                        {gettext('Created {{ datetime }}', {
                            datetime: getRelativeOrAbsoluteDateTime(this.props.item._created, datetimeFormat),
                        })}
                    </time>
                </Row>
                <Row>
                    <time
                        title={longFormatDateTime(this.props.item.versioncreated)}
                        style={{minWidth: '170px'}}
                    >
                        {gettext('Updated {{ datetime }}', {
                            datetime: getRelativeOrAbsoluteDateTime(this.props.item.versioncreated, datetimeFormat),
                        })}
                    </time>
                </Row>
            </Column>
        );
    }
}
