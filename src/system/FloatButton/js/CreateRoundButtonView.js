/*
 * @Author: 大柒
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 05:27:34
 * @Version: Auto.Js Pro
 * 与之RoundButton组件密切相关，RoundButton.js创建了一个基础按钮
 * CreateRoundButtonView.js 是悬浮按钮系统的视图工厂，
 * 它将底层的 RoundButton 组件包装成可配置的按钮实例。
 * 这种设计模式使得系统能够动态创建和管理多个功能按钮，同时保持代码的模块化和可维护性
 * @Description: 创建可配置的圆形按钮组，定义了圆形按钮的各种方法。
    //  根据代码分析，ASSTTYYS NG 的悬浮按钮系统创建了 6 个按钮。
    // 按钮列表
    // 从 MyFloaty.ts 的初始化代码可以看到，系统创建了以下按钮：
    // RunStop - 运行/停止按钮（始终显示）
    // SchemeListMenu - 方案列表菜单按钮（始终显示）
    // SchemeAutoRun - 自动运行按钮（始终显示）
    // CapScreen - 截图按钮（可选显示，由 截图图标 设置控制）
    // ViewLogConsole - 日志控制台按钮（可选显示，由 日志图标 设置控制）
    // ScheduleList - 定时任务按钮（可选显示，由 定时图标 设置和 SDK 版本控制）
    // 按钮创建机制
    // 每个按钮都通过 FloatButton.js 的 addItem 方法创建： FloatButton.js:140-151
    // 这个方法内部使用 CreateRoundButtonView 来实例化具体的按钮视图： CreateRoundButtonView.js:11-51
    // 按钮可见性控制
    // 其中 3 个按钮（截图、日志、定时）的显示由用户设置控制： settings.ts:674-686
    // Notes
    // 前 3 个按钮（RunStop、SchemeListMenu、SchemeAutoRun）是核心功能按钮，始终显示。后 3 个按钮是辅助功能按钮，用户可以通过设置界面控制其显示状态。定时任务按钮还有额外的 Android SDK 版本要求（>= 23）。
 * @LastEditors: 大柒
 * @LastEditTime: 2021-04-19 12:19:02
 */
/*eslint-disable */
function CreateRoundButtonView(name, mGlobal) {
    let view, tag, items;
    let mEventAction = null;
    let state = null;
    tag = name || '';

    function init() {

        // 通过UI布局文件创建视图
        view = ui.inflate("<widget-RoundButton />", null, null);
        / 设置视图布局参数（宽高）
        view.setLayoutParams(new android.widget.LinearLayout.LayoutParams(mGlobal.size, mGlobal.size));

        / 在UI线程中执行后续操作
        viewPost(() => {
            let value;

            // 设置内边距
            view.setPadding(mGlobal.padding, mGlobal.padding, mGlobal.padding, mGlobal.padding);

            / 设置点击事件
            view.on('click', () => {
                if (state != null) {

                    // 如果正在动画中则直接返回
                    if (mGlobal.state.anim) return;

                    // 调用全局动画状态改变方法
                    mGlobal.anim.stateChanged(state, items, view);

                    // 切换状态
                    state = !state;
                }
                if (mEventAction == null) {
                    value = mGlobal.eventActions.item_click(view, tag, state);
                    if (!value || value == undefined) {
                        mGlobal.state.menuOpen = false;
                    };
                } else {
                    value = mEventAction(view, tag, state);
                    if (!value || value == undefined) {
                        mGlobal.state.menuOpen = false;
                    };
                }
                // 如果设置了自动关闭菜单时间
                if (mGlobal.time.autoCloseMenu != 0) {
                    // 清除已有定时器
                    if (mGlobal.timer != null) {
                        clearTimeout(mGlobal.timer);
                    }
                    mGlobal.timer = setTimeout(() => {
                        mGlobal.state.menuOpen = false;
                        mGlobal.timer = null;
                    }, mGlobal.time.autoCloseMenu);
                }
            });
        });
    }

    // 获取视图对象的方法
    this.getView = () => view;

    // 设置点击事件回调的方法
    this.onClick = function (eventAction) {
        mEventAction = eventAction;
        return this;  //// 支持链式调用
    }

    // 设置视图大小的方法
    this.setSize = function (px) {
        viewPost(function () {
            view.attr('w', parseInt(px) + 'px');
            view.attr('h', parseInt(px) + 'px');
        });
        return this;
    }

    // 设置内边距的方法
    this.setPadding = function (px) {
        viewPost(() => view.setPadding(px, px, px, px));
        return this;
    }

    // 设置图标的方法
    this.setIcon = function (value) {
        viewPost(() => view.attr('src', value));
        return this;
    }

    // 设置图标色调的方法
    this.setTint = function (colorStr) {
        viewPost(() => view.attr('tint', colorStr));
        return this;
    }

    // 设置背景色的方法
    this.setColor = function (colorStr) {
        viewPost(() => view.attr('backgroundTint', colorStr));
        return this;
    }

    // 设置选中状态的方法
    this.setChecked = function (value) {
        if (state == value || state == null) return this;
        viewPost(() => view.performClick());
        return this;
    }

    // 获取当前选中状态的方法
    this.getChecked = function () {
        return state;
    }

    // 将视图转换为复选框的方法，通过代码逻辑让普通按钮具备复选框的核心功能‌
    this.toCheckbox = function (action) {
        action(new ViewToCheckbox(this));
        return this;
    }

    // 内部类：通过代码逻辑让普通按钮具备复选框的核心功能‌
    function ViewToCheckbox(viewUtil) {
        state = false;
        items = {};

        this.icon1 = function (value) {
            items.icon1 = value;
            viewUtil.setIcon(value);
            return this;
        }

        this.icon2 = function (value) {
            items.icon2 = value;
            return this;
        }

        this.tint1 = function (value) {
            items.tint1 = value;
            viewUtil.setTint(value);
            return this;
        }

        this.tint2 = function (value) {
            items.tint2 = value;
            return this;
        }

        this.color1 = function (value) {
            items.color1 = value;
            viewUtil.setColor(value);
            return this;
        }

        this.color2 = function (value) {
            items.color2 = value;
            return this;
        }

        // 设置动画时间
        this.setAnimTime = function (value) {
            animTime = value;
            return this;
        }

        return this;
    }

    // 在UI线程中执行操作的辅助函数
    function viewPost(action) {
        ui.run(action);
    }

    init();
};

module.exports = CreateRoundButtonView;
