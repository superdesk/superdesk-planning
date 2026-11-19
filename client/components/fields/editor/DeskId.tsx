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
        const {restrictToUser, userId, desks, userDesks, includePersonal, clearable, defaultValue} = this.props;
        let deskOptions: Array<IDesk>;

        if (restrictToUser) {
            deskOptions = userId != null ? getDesksForUser(userId, desks) : [...userDesks];
        } else {
            deskOptions = [...desks];
        }

        if (includePersonal) {
            deskOptions.push(PERSONAL_WORKSPACE);
        }

        const defaultDesk = !clearable && !defaultValue ? deskOptions[0]?._id : defaultValue;

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'desk'}
                label={this.props.label ?? gettext('Desk')}
                options={deskOptions}
                labelField={'name'}
                keyField={'_id'}
                valueAsString={true}
                defaultValue={defaultDesk}
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
