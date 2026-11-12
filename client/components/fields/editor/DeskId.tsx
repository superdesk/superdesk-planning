import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IDesk, IUser} from 'superdesk-api';
import {IEditorFieldProps} from '../../../interfaces';
import {PERSONAL_WORKSPACE} from '../../../constants';
import {getDesksForUser} from '../../../utils';

import {desks as getDesks, userDesks as getUserDesks} from '../../../selectors/general';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    desks: Array<IDesk>;
    restrictToUser?: boolean;
    userDesks: Array<IDesk>;
    includePersonal?: boolean;
    clearable?: boolean;
    userId?: IUser['_id'];
}

const mapStateToProps = (state) => ({
    desks: getDesks(state),
    userDesks: getUserDesks(state),
});

export class EditorFieldDeskIdComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        let desks: Array<IDesk>;

        if (this.props.restrictToUser) {
            desks = this.props.userId != null
                ? getDesksForUser(this.props.userId, this.props.desks)
                : Array.from(this.props.userDesks);
        } else {
            desks = Array.from(this.props.desks);
        }

        if (this.props.includePersonal) {
            desks.push(PERSONAL_WORKSPACE);
        }

        let defaultValue = this.props.defaultValue;

        if (!this.props.clearable && !defaultValue) {
            defaultValue = desks[0]?._id;
        }

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'desk'}
                label={this.props.label ?? gettext('Desk')}
                options={desks}
                labelField={'name'}
                keyField={'_id'}
                valueAsString={true}
                defaultValue={defaultValue}
            />
        );
    }
}

export const EditorFieldDeskId = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldDeskIdComponent);
