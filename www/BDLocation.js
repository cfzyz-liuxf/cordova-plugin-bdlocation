var exec = require('cordova/exec');
module.exports = {
    /* args:
    {
        mode [string](默认为高精度. "Battery_Saving":低功耗模式, "Device_Sensors":仅设备Gps模式, "Hight_Accuracy":高精度模式)

        coor [string](仅对Android有效 默认为bd09ll. "gcj02":返回国测局经纬度坐标系, "bd09":返回百度墨卡托坐标系, "bd09ll":返回百度经纬度坐标系)
        span [int](默认为0. 单位毫秒 0时仅定位一次. 当<1000(1s)时，定时定位无效)
        gps [boolean](仅对Android有效 默认为false. 是否使用GPS)
        ignoreKillProcess [boolean](仅对Android有效 默认为true. 设置是否在stop的时候杀死SERVICE进程)
        enableSimulateGps [boolean](仅对Android有效 默认为false. 设置是否允许模拟GPS true:允许； false:不允许)

        distanceFilter [double](仅对IOS有效 设定定位的最小更新距离 单位米)
    }
    return:
    {
        code: int, //定位结果 locType
        msg: string, //定位相关描述信息 locTypeDescription
        data:{ //data失败时为空
            time: string, //server返回的当前定位时间
            latitude: double, // 纬度坐标 默认值Double.MIN_VALUE
            longitude: double,// 经度坐标 默认值Double.MIN_VALUE
            altitude: double, // 高度信息 仅在GPS模式下有效
            radius: float, // 精度:米
        }
    }
    */
    watch: function (param, success, error) {
        var timeoutTimer = {timer: null};

        var win = function (p) {
            clearTimeout(timeoutTimer.timer);
            if (!(timeoutTimer.timer)) {
                // Timeout already happened, or native fired error callback for
                // this geo request.
                // Don't continue with success callback.
                return;
            }
            success(p);
        };
        var fail = function (e) {
            clearTimeout(timeoutTimer.timer);
            timeoutTimer.timer = null;
            if (error) {
                error(e);
            }
        };

        if (param && param.timeout >= 1000) {
            // If the timeout value was not set to Infinity (default), then
            // set up a timeout function that will fire the error callback
            // if no successful position was retrieved before timeout expired.
            timeoutTimer.timer = createTimeout(fail, param.timeout);
        } else {
            // This is here so the check in the win function doesn't mess stuff up
            // may seem weird but this guarantees timeoutTimer is
            // always truthy before we call into native
            timeoutTimer.timer = true;
        }
        exec(win, fail, "BDLocation", "watch", [
            param.mode != undefined ? param.mode : "Hight_Accuracy",
            param.coor != undefined ? param.coor : "bd09ll",
            param.span != undefined ? param.span : 0,
            param.gps != undefined ? param.gps : false,
            param.ignoreKillProcess != undefined ? param.ignoreKillProcess : true,
            param.enableSimulateGps != undefined ? param.enableSimulateGps : false,
            param.distanceFilter != undefined ? param.distanceFilter : 1
        ]);
        return timeoutTimer;
    },

    /**
     * 停止定位
     */
    stop: function (success, error) {
        exec(success, error, "BDLocation", "stop", []);
    }
};

function createTimeout(errorCallback, timeout) {
    var t = setTimeout(function () {
        clearTimeout(t);
        t = null;
        errorCallback({
            code: -1,
            message: "Position retrieval timed out."
        });
    }, timeout);
    return t;
}
