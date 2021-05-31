
declare const angular: IAngularStatic;

type DeepPartial<T> = {
    [K in keyof T]?: DeepPartial<T[K]>;
}
