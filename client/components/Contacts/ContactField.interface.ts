import {IPrivileges} from '../../interfaces';
import {IContact} from 'superdesk-api';

interface IBaseProps extends IContactReduxStateProps, IContactReduxDispatchProps {
    field: string;
    label?: string;
    querySearch?: boolean;
    readOnly?: boolean;
    paddingTop?: boolean;
    testId?: string;
    onFocus?(): void;
    refNode?(node: HTMLElement): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface ISingleContactProps extends IBaseProps {
    singleValue: true;
    value: IContact['_id'] | null;
    onChange(field: string, value: IContact['_id'] | null): void;
}

interface IMultiContactProps extends IBaseProps {
    singleValue: false;
    value: Array<IContact['_id']> | null;
    onChange(field: string, value: Array<IContact['_id']>): void;
}

export type IContactFieldProps = ISingleContactProps | IMultiContactProps;

export interface IContactReduxDispatchProps {
    addContact(newContact: Partial<IContact>): void;
}

export interface IContactReduxStateProps {
    contacts: Array<IContact>;
    privileges: IPrivileges;
}

export type IContactPropsNoRedux =
    Omit<IContactFieldProps, keyof IContactReduxStateProps | keyof IContactReduxDispatchProps>;
