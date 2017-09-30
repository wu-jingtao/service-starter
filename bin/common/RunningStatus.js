"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 标记程序的运行状态
 *
 * @export
 * @enum {number}
 */
var RunningStatus;
(function (RunningStatus) {
    /**
     *  已停止
     */
    RunningStatus[RunningStatus["stopped"] = 0] = "stopped";
    /**
     *  正在运行
     */
    RunningStatus[RunningStatus["running"] = 1] = "running";
    /**
     *  正在启动
     */
    RunningStatus[RunningStatus["starting"] = 2] = "starting";
    /**
     *  正在停止
     */
    RunningStatus[RunningStatus["stopping"] = 3] = "stopping";
})(RunningStatus = exports.RunningStatus || (exports.RunningStatus = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9SdW5uaW5nU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7O0dBS0c7QUFDSCxJQUFZLGFBaUJYO0FBakJELFdBQVksYUFBYTtJQUNyQjs7T0FFRztJQUNILHVEQUFPLENBQUE7SUFDUDs7T0FFRztJQUNILHVEQUFPLENBQUE7SUFDUDs7T0FFRztJQUNILHlEQUFRLENBQUE7SUFDUjs7T0FFRztJQUNILHlEQUFRLENBQUE7QUFDWixDQUFDLEVBakJXLGFBQWEsR0FBYixxQkFBYSxLQUFiLHFCQUFhLFFBaUJ4QiIsImZpbGUiOiJjb21tb24vUnVubmluZ1N0YXR1cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiDmoIforrDnqIvluo/nmoTov5DooYznirbmgIFcclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGVudW0ge251bWJlcn1cclxuICovXHJcbmV4cG9ydCBlbnVtIFJ1bm5pbmdTdGF0dXMge1xyXG4gICAgLyoqXHJcbiAgICAgKiAg5bey5YGc5q2iIFxyXG4gICAgICovXHJcbiAgICBzdG9wcGVkLFxyXG4gICAgLyoqXHJcbiAgICAgKiAg5q2j5Zyo6L+Q6KGMXHJcbiAgICAgKi9cclxuICAgIHJ1bm5pbmcsXHJcbiAgICAvKipcclxuICAgICAqICDmraPlnKjlkK/liqhcclxuICAgICAqL1xyXG4gICAgc3RhcnRpbmcsXHJcbiAgICAvKipcclxuICAgICAqICDmraPlnKjlgZzmraJcclxuICAgICAqL1xyXG4gICAgc3RvcHBpbmdcclxufSJdfQ==
