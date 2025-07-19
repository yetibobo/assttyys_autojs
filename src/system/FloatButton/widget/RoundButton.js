/*
 * @Author: 大柒
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 04:34:46
 * @Version: Auto.Js Pro
 * @Description: 自定义控件 按钮
 
 * 这个文件定义了一个自定义的圆形按钮 UI 组件
 * 用于悬浮按钮系统中的按钮元素。实现如下：
 * UI 组件定义：通过 render() 方法定义按钮的 XML 布局结构
 * 样式配置：设置默认的外观属性，包括内边距、居中对齐、背景和着色
 * 组件注册：将自定义组件注册到 Auto.js Pro 的 UI 系统中
 * 通过 ui.registerWidget("widget-RoundButton", RoundButton) 注册后，
 * 可以在 XML 布局中使用 <widget-RoundButton> 标签来创建圆形按钮实例。
 * Android 确实没有原生的圆形按钮组件，这就是为什么 ASSTTYYS NG 项目需要自定义实现 RoundButton 组件的原因。
 * Android 系统提供的原生按钮组件（如 Button、ImageButton）默认都是矩形的。要实现圆形按钮效果，开发者通常需要：
 * 使用自定义背景drawable：创建圆形背景资源
 * 自定义View：继承现有组件并重写绘制逻辑
 * 使用第三方库：引入专门的圆形按钮库
 
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
        // 在JavaScript中，this代表当前执行上下文的对象。在构造函数中：
        // ‌this的指向‌
        // 当通过new RoundButton()创建实例时，this自动指向新创建的空对象（即将成为实例的对象）。
        // ‌ui.Widget.call(this)的作用‌
        // 这是经典的构造函数继承模式：
        // call()方法将父类ui.Widget的构造函数绑定到当前this（子类实例）上执行
        // 相当于让父类构造函数给这个新对象添加父类的属性和方法
        // 示例:
        // function 毛坯房() { this.墙壁 = true; }
        // function 精装房() {
        //   毛坯房.call(this); // 先继承毛坯房的墙壁
        //   this.地板 = "实木"; // 再添加新装修
        // }

                // 4. 调用父类构造函数，确保父类初始化逻辑被执行
        ui.Widget.call(this);

        // JavaScript中的.call()方法是函数对象的内置方法
        // 核心功能
        // ‌显式绑定this值‌
        // 1.强制指定函数执行时的上下文对象（即函数内部this的指向）
        // 示例：
        // function showName() { console.log(this.name) }
        // const obj = { name: 'Alice' };
        // showName.call(obj); // 输出"Alice"
        // ‌2.参数传递‌
        // 支持以逗号分隔的形式传递参数（与.apply()的数组传参方式形成对比）
        // function sum(a, b) { return a + b }
        // sum.call(null, 1, 2); // 返回3
        // ‌3.实现继承‌
        // 在构造函数中调用父类构造函数（如用户原始代码中的ui.Widget.call(this)）
        // function Parent() { this.type = 'base' }
        // function Child() { Parent.call(this) }
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
