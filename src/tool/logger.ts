import log from 'log-formatter';

// #region 普通消息

/**
 * 打印消息
 * @param message 信息
 */
export const printInfo: (message: string) => void =
    log
        .dateTime
        .text.cyan;

/**
 * 打印成功消息
 * @param message 信息
 */
export const printSuccess: (message: string) => void =
    log
        .dateTime
        .text.green;

/**
 * 打印警告消息
 * @param message 信息
 * @param err 错误信息
 */
export const printWarning: (message: string, err: unknown) => void =
    log
        .warn
        .dateTime
        .text.yellow
        .linebreak;

/**
 * 打印错误消息
 * @param message 信息
 * @param err 错误信息
 */
export const printError: (message: string, err: unknown) => void =
    log
        .error
        .dateTime
        .text.red
        .linebreak;

// #endregion

// #region 模块消息

/**
 * 打印模块消息
 * @param location 位置
 * @param message 信息
 */
export const printModuleInfo: (location: string, message: string) => void =
    log
        .dateTime
        .location
        .text.cyan;

/**
 * 打印模块成功消息
 * @param location 位置
 * @param message 信息
 */
export const printModuleSuccess: (location: string, message: string) => void =
    log
        .dateTime
        .location
        .text.green;

/**
 * 打印模块警告消息
 * @param location 位置
 * @param message 信息
 * @param err 错误信息
 */
export const printModuleWarning: (location: string, message: string, err: unknown) => void =
    log
        .warn
        .dateTime
        .location
        .text.yellow
        .linebreak;

/**
 * 打印模块错误消息
 * @param location 位置
 * @param message 信息
 * @param err 错误信息
 */
export const printModuleError: (location: string, message: string, err: unknown) => void =
    log
        .error
        .dateTime
        .location
        .text.red
        .linebreak;

// #endregion

// #region 管理器消息

/**
 * 打印管理器消息
 * @param location 位置
 * @param message 信息
 */
export const printManagerInfo: (location: string, message: string) => void =
    log
        .dateTime
        .location.bold
        .text.cyan.bold;

/**
 * 打印管理器成功消息
 * @param location 位置
 * @param message 信息
 */
export const printManagerSuccess: (location: string, message: string) => void =
    log
        .dateTime
        .location.bold
        .text.green.bold;

/**
 * 打印管理器警告消息
 * @param location 位置
 * @param message 信息
 * @param err 错误信息
 */
export const printManagerWarning: (location: string, message: string, err: unknown) => void =
    log
        .warn
        .dateTime
        .location.bold
        .text.yellow.bold
        .linebreak;

/**
 * 打印管理器错误消息
 * @param location 位置
 * @param message 信息
 * @param err 错误信息
 */
export const printManagerError: (location: string, message: string, err: unknown) => void =
    log
        .error
        .dateTime
        .location.bold
        .text.red.bold
        .linebreak;

// #endregion
