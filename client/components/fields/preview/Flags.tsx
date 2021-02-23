import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps, IPlanningItem} from '../../../interfaces';

import {PreviewFormItem} from './base/PreviewFormItem';

interface IProps extends IListFieldProps {
    item: IPlanningItem;
}

export class PreviewFieldFlags extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return !this.props.item.flags?.marked_for_not_publication ? null : (
            <PreviewFormItem renderEmpty={true}>
                <span className="state-label not-for-publication">
                    {gettext('Not for Publication')}
                </span>
            </PreviewFormItem>
        );
    }
}
