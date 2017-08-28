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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvSGVhbHRoU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7O0dBS0c7QUFDSCxJQUFZLFlBVVg7QUFWRCxXQUFZLFlBQVk7SUFDcEI7O09BRUc7SUFDSCxxREFBVyxDQUFBO0lBRVg7O09BRUc7SUFDSCx5REFBYSxDQUFBO0FBQ2pCLENBQUMsRUFWVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQVV2QiIsImZpbGUiOiJTZXJ2aWNlTW9kdWxlL0hlYWx0aFN0YXR1cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBEb2NrZXIg5a655Zmo5YGl5bq35qOA5p+l55qE6L+U5Zue5YC8XHJcbiAqIFxyXG4gKiBAZXhwb3J0XHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5leHBvcnQgZW51bSBIZWFsdGhTdGF0dXMge1xyXG4gICAgLyoqXHJcbiAgICAgKiDov5nkuKrmnI3liqHmmK/lgaXlurfnmoTvvIzlj6/ku6Xkvb/nlKhcclxuICAgICAqL1xyXG4gICAgc3VjY2VzcyA9IDAsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDov5nkuKrmnI3liqHnjrDlnKjkuI3og73mraPluLjlt6XkvZzkuoZcclxuICAgICAqL1xyXG4gICAgdW5oZWFsdGh5ID0gMVxyXG59Il19
