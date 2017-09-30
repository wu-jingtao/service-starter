"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseServicesManager_1 = require("./../common/BaseServicesManager");
const RunningStatus_1 = require("../common/RunningStatus");
class BrowserServicesManager extends BaseServicesManager_1.BaseServicesManager {
    constructor(_config = {}) {
        super();
        this._config = _config;
    }
    onError(errName, err, service) {
        super.onError(errName, err, service);
        if (this._config.stopOnError === true) {
            if (this.status !== RunningStatus_1.RunningStatus.stopping && this.status !== RunningStatus_1.RunningStatus.stopped) {
                this.stop(1);
            }
        }
    }
}
exports.BrowserServicesManager = BrowserServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkJyb3dzZXIvQnJvd3NlclNlcnZpY2VzTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHlFQUFzRTtBQUN0RSwyREFBd0Q7QUFHeEQsNEJBQW9DLFNBQVEseUNBQW1CO0lBQzNELFlBQTZCLFVBQXdDLEVBQUU7UUFDbkUsS0FBSyxFQUFFLENBQUM7UUFEaUIsWUFBTyxHQUFQLE9BQU8sQ0FBbUM7SUFFdkUsQ0FBQztJQUVELE9BQU8sQ0FBQyxPQUEyQixFQUFFLEdBQVUsRUFBRSxPQUEwQjtRQUN2RSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLDZCQUFhLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNsRixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBYkQsd0RBYUMiLCJmaWxlIjoiQnJvd3Nlci9Ccm93c2VyU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnJvd3NlclNlcnZpY2VzTWFuYWdlckNvbmZpZyB9IGZyb20gJy4vQnJvd3NlclNlcnZpY2VzTWFuYWdlckNvbmZpZyc7XHJcbmltcG9ydCB7IEJhc2VTZXJ2aWNlc01hbmFnZXIgfSBmcm9tICcuLy4uL2NvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyJztcclxuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gJy4uL2NvbW1vbi9SdW5uaW5nU3RhdHVzJztcclxuaW1wb3J0IHsgQmFzZVNlcnZpY2VNb2R1bGUgfSBmcm9tICcuLi9jb21tb24vQmFzZVNlcnZpY2VNb2R1bGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEJyb3dzZXJTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBCYXNlU2VydmljZXNNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX2NvbmZpZzogQnJvd3NlclNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkVycm9yKGVyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvciwgc2VydmljZTogQmFzZVNlcnZpY2VNb2R1bGUpIHtcclxuICAgICAgICBzdXBlci5vbkVycm9yKGVyck5hbWUsIGVyciwgc2VydmljZSk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2NvbmZpZy5zdG9wT25FcnJvciA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgdGhpcy5zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19
