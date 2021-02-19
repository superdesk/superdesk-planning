import * as React from 'react';
import {connect} from 'react-redux';

import {IPlanningItem, ISearchParams, IListFieldProps, IUrgency} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {PreviewFormItem} from './base/PreviewFormItem';
import {ColouredValueInput} from '../../UI/Form';
import {getUrgencies} from '../../../selectors';
import {getItemInArrayById} from '../../../utils';

interface IProps extends IListFieldProps {
    item: IPlanningItem | ISearchParams;
    urgencies: Array<IUrgency>;
}

const mapStateToProps = (state) => ({
    urgencies: getUrgencies(state),
});

export class PreviewFieldUrgencyComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const qcode = typeof this.props.item.urgency === 'number' ?
            this.props.item.urgency :
            this.props.item.urgency?.qcode;
        const urgency = getItemInArrayById(this.props.urgencies, qcode, 'qcode');

        return (
            <PreviewFormItem renderEmpty={true}>
                <ColouredValueInput
                    value={urgency}
                    label={gettext('Urgency')}
                    iconName="urgency-label"
                    readOnly={true}
                    options={this.props.urgencies}
                    row={true}
                    language={this.props.language}
                />
            </PreviewFormItem>
        );
    }
}

export const PreviewFieldUrgency = connect(mapStateToProps)(PreviewFieldUrgencyComponent);
