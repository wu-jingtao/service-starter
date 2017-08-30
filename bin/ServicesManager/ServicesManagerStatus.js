"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ServicesManager的运行状态
 *
 * @export
 * @enum {number}
 */
var ServicesManagerStatus;
(function (ServicesManagerStatus) {
    /**
     *  已停止
     */
    ServicesManagerStatus[ServicesManagerStatus["stopped"] = 0] = "stopped";
    /**
     *  正在运行
     */
    ServicesManagerStatus[ServicesManagerStatus["running"] = 1] = "running";
    /**
     *  正在启动
     */
    ServicesManagerStatus[ServicesManagerStatus["starting"] = 2] = "starting";
    /**
     *  正在停止
     */
    ServicesManagerStatus[ServicesManagerStatus["stopping"] = 3] = "stopping";
})(ServicesManagerStatus = exports.ServicesManagerStatus || (exports.ServicesManagerStatus = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXJTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7R0FLRztBQUNILElBQVkscUJBaUJYO0FBakJELFdBQVkscUJBQXFCO0lBQzdCOztPQUVHO0lBQ0gsdUVBQU8sQ0FBQTtJQUNQOztPQUVHO0lBQ0gsdUVBQU8sQ0FBQTtJQUNQOztPQUVHO0lBQ0gseUVBQVEsQ0FBQTtJQUNSOztPQUVHO0lBQ0gseUVBQVEsQ0FBQTtBQUNaLENBQUMsRUFqQlcscUJBQXFCLEdBQXJCLDZCQUFxQixLQUFyQiw2QkFBcUIsUUFpQmhDIiwiZmlsZSI6IlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXJTdGF0dXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNlcnZpY2VzTWFuYWdlcueahOi/kOihjOeKtuaAgVxuICogXG4gKiBAZXhwb3J0XG4gKiBAZW51bSB7bnVtYmVyfVxuICovXG5leHBvcnQgZW51bSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMge1xuICAgIC8qKlxuICAgICAqICDlt7LlgZzmraIgXG4gICAgICovXG4gICAgc3RvcHBlZCxcbiAgICAvKipcbiAgICAgKiAg5q2j5Zyo6L+Q6KGMXG4gICAgICovXG4gICAgcnVubmluZyxcbiAgICAvKipcbiAgICAgKiAg5q2j5Zyo5ZCv5YqoXG4gICAgICovXG4gICAgc3RhcnRpbmcsXG4gICAgLyoqXG4gICAgICogIOato+WcqOWBnOatolxuICAgICAqL1xuICAgIHN0b3BwaW5nXG59Il19
