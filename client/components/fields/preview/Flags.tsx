import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps, IPlanningCoverageItem, IPlanningItem} from '../../../interfaces';

import {PreviewFormItem} from './base/PreviewFormItem';

interface IProps extends IListFieldProps {
    item: {
        flags: IPlanningItem['flags'] & IPlanningCoverageItem['flags']
    };
}

export class PreviewFieldFlags extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                {!this.props.item.flags?.marked_for_not_publication ? null : (
                    <PreviewFormItem renderEmpty={true}>
                        <span className="state-label not-for-publication">
                            {gettext('Not for Publication')}
                        </span>
                    </PreviewFormItem>
                )}
                {!this.props.item.flags?.no_content_linking ? null : (
                    <PreviewFormItem renderEmpty={true}>
                        <span className="state-label not-for-publication">
                            {gettext('Do not link content updates')}
                        </span>
                    </PreviewFormItem>
                )}
            </React.Fragment>
        );
    }
}
