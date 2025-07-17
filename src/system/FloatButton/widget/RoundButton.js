/*
 * @Author: 大柒
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 04:34:46
 * @Version: Auto.Js Pro
 * @Description: 自定义控件 按钮
 * @LastEditors: 大柒
 * @LastEditTime: 2021-04-19 12:19:40
 */
/*eslint-disable */

// 1. 使用立即执行函数(IIFE)包裹代码，创建闭包作用域避免污染全局
var RoundButton = (function () {

    // 2.  $util.extend(target, source)
    // target {object}  目标构造函数
    // source {object} 要继承的构造函数
    // 将原型方法从一个构造函数继承到另一个构造函数。
    // 类似于Node.js中的util.inherits
    util.extend(RoundButton, ui.Widget);
    
    // 3. 定义RoundButton构造函数
    function RoundButton() {
        
        // 4. 调用父类构造函数，确保父类初始化逻辑被执行
        ui.Widget.call(this);
    }
    
    // 5. 在原型上添加render方法（重写父类方法）
    RoundButton.prototype.render = function () {
        
         // 6. 返回按钮的HTML字符串定义
        return "<img\
            padding='8'\
            layout_gravity='center_vertical'\
            background='@drawable/abc_seekbar_tick_mark_material'\
            backgroundTint='#FFFFFF'\
        />";
    }
    
    // 7. 将自定义组件注册到UI系统，注册名为"widget-RoundButton"
    ui.registerWidget("widget-RoundButton", RoundButton);
    
    // 8. 返回构造函数供外部使用
    return RoundButton;
})();// 立即执行函数结束

// 9. 通过CommonJS规范导出模块
module.exports;
