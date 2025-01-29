import {PureComponent} from 'react';
import {DebouncedFunc, debounce} from 'lodash';
import {IPlanningCoverageItem} from '../../../interfaces';

interface IDebouncedChangeHOCProps {
    children: (
        changedValue: Array<IPlanningCoverageItem>,
        onChange: (fieldPath: string, value: any) => void,
    ) => JSX.Element;
    value: Array<IPlanningCoverageItem>;
    onChange: (newValue: Array<IPlanningCoverageItem>) => void;
    processChangeQueue: (changeQueue: Array<{fieldPath: string; value: any;}>, value: any) => any;
}

interface IDebouncedChangeHOCState {
    renderedValue: Array<IPlanningCoverageItem>;
}

export class DebouncedChangeHOC extends PureComponent<IDebouncedChangeHOCProps, IDebouncedChangeHOCState> {
    debouncedFn: DebouncedFunc<() => void>;
    changeQueue: Array<{fieldPath: string; value: any;}>;

    constructor(props: IDebouncedChangeHOCProps) {
        super(props);

        this.state = {
            renderedValue: this.props.value,
        };

        this.changeQueue = [];
        this.debouncedFn = debounce(() => {
            const valueUpdated = this.props.processChangeQueue(this.changeQueue, this.state.renderedValue);

            this.props.onChange(valueUpdated);
            this.changeQueue = [];
        }, 1500);
    }

    componentWillUnmount(): void {
        this.debouncedFn.cancel();
    }

    render() {
        return this.props.children(
            this.state.renderedValue,
            (fieldPath, value) => {
                this.changeQueue = [
                    ...this.changeQueue,
                    {fieldPath, value},
                ];

                this.setState({
                    renderedValue: this.props.processChangeQueue(this.changeQueue, this.state.renderedValue),
                });

                this.debouncedFn();
            },
        );
    }
}
