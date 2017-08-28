"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Docker 容器健康检查的返回值
 *
 * @export
 * @enum {number}
 */
var HealthStatus;
(function (HealthStatus) {
    /**
     * 这个服务是健康的，可以使用
     */
    HealthStatus[HealthStatus["success"] = 0] = "success";
    /**
     * 这个服务现在不能正常工作了
     */
    HealthStatus[HealthStatus["unhealthy"] = 1] = "unhealthy";
})(HealthStatus = exports.HealthStatus || (exports.HealthStatus = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvSGVhbHRoU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7O0dBS0c7QUFDSCxJQUFZLFlBVVg7QUFWRCxXQUFZLFlBQVk7SUFDcEI7O09BRUc7SUFDSCxxREFBVyxDQUFBO0lBRVg7O09BRUc7SUFDSCx5REFBYSxDQUFBO0FBQ2pCLENBQUMsRUFWVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQVV2QiIsImZpbGUiOiJTZXJ2aWNlTW9kdWxlL0hlYWx0aFN0YXR1cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRG9ja2VyIOWuueWZqOWBpeW6t+ajgOafpeeahOi/lOWbnuWAvFxuICogXG4gKiBAZXhwb3J0XG4gKiBAZW51bSB7bnVtYmVyfVxuICovXG5leHBvcnQgZW51bSBIZWFsdGhTdGF0dXMge1xuICAgIC8qKlxuICAgICAqIOi/meS4quacjeWKoeaYr+WBpeW6t+eahO+8jOWPr+S7peS9v+eUqFxuICAgICAqL1xuICAgIHN1Y2Nlc3MgPSAwLFxuXG4gICAgLyoqXG4gICAgICog6L+Z5Liq5pyN5Yqh546w5Zyo5LiN6IO95q2j5bi45bel5L2c5LqGXG4gICAgICovXG4gICAgdW5oZWFsdGh5ID0gMVxufSJdfQ==
