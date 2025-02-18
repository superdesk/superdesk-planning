import {PureComponent} from 'react';
import {DebouncedFunc, debounce} from 'lodash';
import {IPlanningCoverageItem} from '../../../interfaces';

interface IProps {
    children: (
        changedValue: Array<IPlanningCoverageItem>,
        onChange: (fieldPath: string, value: any) => void,
    ) => JSX.Element;
    value: Array<IPlanningCoverageItem>;
    onChange: (newValue: Array<IPlanningCoverageItem>) => void;
    processChangeQueue: (changeQueue: Array<{fieldPath: string; value: any;}>, value: any) => any;
}

interface IState {
    renderedValue: Array<IPlanningCoverageItem>;
    changeQueue: Array<{fieldPath: string; value: any;}>;
}

export class DebouncedChangeHOC extends PureComponent<IProps, IState> {
    debouncedFn: DebouncedFunc<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            renderedValue: this.props.value,
            changeQueue: [],
        };

        this.debouncedFn = debounce(() => {
            const valueUpdated = this.props.processChangeQueue(this.state.changeQueue, this.props.value);

            this.props.onChange(valueUpdated);
            this.setState({
                changeQueue: [],
            });
        }, 1000);
    }

    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (state.changeQueue.length > 0) {
            return null;
        }

        return {
            renderedValue: props.value,
        };
    }

    componentWillUnmount(): void {
        this.debouncedFn.flush();
    }

    render() {
        return this.props.children(
            this.state.renderedValue,
            (fieldPath, value) => {
                const changeQueue = [
                    ...this.state.changeQueue,
                    {fieldPath, value},
                ];

                this.setState({
                    changeQueue: changeQueue,
                    renderedValue: this.props.processChangeQueue(changeQueue, this.state.renderedValue),
                });

                this.debouncedFn();
            },
        );
    }
}
