/*
 * @Author: 大柒
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 04:29:01
 * @Version: Auto.Js Pro
 * @Description: 工具类
 * 悬浮按钮系统中的工具类模块，主要实现了屏幕尺寸转换和屏幕方向检测功能并提供给FloatButton.js使用
 
 * @LastEditors: 大柒
 * @LastEditTime: 2021-04-19 12:19:14
 */

/*eslint-disable */

// 核心功能实现
// 该文件导出一个 mUtil 工具对象，提供以下三个主要功能：
// 1. 像素密度转换函数
// dp2px(dp): 将 dp 单位转换为像素值
// px2dp(px): 将像素值转换为 dp 单位
// 这些函数基于设备的像素密度进行计算： init.js:14-18
// 2. 屏幕方向检测
// isHorizontalScreen() 函数检测当前屏幕是否为横屏模式： init.js:19-32
// 该函数通过检查 config.orientation 来判断屏幕方向，返回 true 表示横屏，false 表示竖屏。
// 在悬浮按钮系统中的使用
// 该工具模块被 FloatButton.js 主文件引入并使用： FloatButton.js:13
// 在悬浮按钮的配置中，使用这些工具函数来设置尺寸和检测屏幕方向： FloatButton.js:26-35
// Notes
// init.js 是悬浮按钮系统的基础工具模块，为整个悬浮按钮 UI 组件提供了必要的屏幕适配和方向检测功能。
// 这些工具函数确保悬浮按钮能够在不同屏幕密度和方向的设备上正确显示和定位。

// 创建一个空对象
let mUtil = {};

// 创建一个立即执行的函数
(function () {
    // 标准的 Android 原生 API 调用，用于获取当前设备的屏幕密度比例（逻辑像素密度与 160dpi 基准的比例值）
    // Context 是 Android 系统中的核心抽象类，代表应用程序的运行环境
    // getResources()：获取应用资源管理器实例
    // getDisplayMetrics()：返回包含屏幕参数的 DisplayMetrics 对象
    // density 属性：表示像素密度比例（如 1.0 对应 160dpi，2.0 对应 320dpi
    const scale = context.getResources().getDisplayMetrics().density;

    
    // Android 开发中获取设备当前配置信息的核心方法，其返回的 Configuration 对象包含以下关键数据
    // 一、获取屏幕方向（横竖屏状态） int orientation = config.orientation; 
    // 1:竖屏(ORIENTATION_PORTRAIT), 2:横屏(ORIENTATION_LANDSCAPE):ml-citation{ref="7" data="citationList"}
    // 二、读取语言区域设置（多语言支持）Locale locale = config.locale; 
    // 获取当前系统语言:ml-citation{ref="1,9" data="citationList"}
    // 三、检测屏幕布局类型（平板/手机判断）int screenLayout = config.screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK; 
    // 屏幕尺寸分类:ml-citation{ref="8" data="citationList"}
    let config = context.getResources().getConfiguration();

    
    // Math.floor 是 Java 标准库中的数学函数，属于 java.lang.Math 类，并非 Android 特有，
    // 但可在 Android 开发中直接调用。其核心功能是‌向下取整，其它的有：
    // Math.ceil：向上取整
    // Math.round：四舍五入（本质是 floor(x + 0.5)）

    // 在mUtil对象动态添加.dp2px 属性，且是一个函数Math.floor(dp * scale + 0.5)，参数是dp
    mUtil.dp2px = dp => Math.floor(dp * scale + 0.5);
    // 你会发现这里用了隐式写法，只有一个参数时可以省略第一个圆括号，省略花括号可以省略写return
    // 不然要写成(dp) => { return Math.floor(...) }
    mUtil.px2dp = px => Math.floor(px / scale + 0.5);
    mUtil.isHorizontalScreen = function () {
        // let dm = context.getResources().getDisplayMetrics();
        // let wm = context.getSystemService(context.WINDOW_SERVICE);
        // wm.getDefaultDisplay().getRealMetrics(dm);
        // return dm.widthPixels > dm.heightPixels;
        let ori = config.orientation;
        if (ori == config.ORIENTATION_LANDSCAPE) {
            //横屏
            return true;
        } else if (ori == config.ORIENTATION_PORTRAIT) {
            //竖屏
            return false;
        }
    }
})();

module.exports = mUtil;

