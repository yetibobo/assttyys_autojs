// 作业线程effect$，非 UI 线程的操作都可以在这个作业线程下进行，避免了开启多个线程。
// core初始化完毕后，subscribe内的函数才会开始执行
import { effect$ } from '@auto.pro/core';

// 悬浮按钮，对大柒的悬浮按钮进行封装
import myFloaty from '@/system/MyFloaty';

// 加载webviewEvents文件夹下的index.ts
import webviewEvents from '@/system/webviewEvents';

// 加载输入法隐蒧处理
import InputHideUtil from '@/system/inputhideutil';

// 加载存储
import { storeCommon } from '@/system/Store/store';

// 加载绘画
import drawFloaty from '@/system/drawFloaty';

//加载日志和网页状态检查？
import { doInitHookConsoleLog, getWebLoaded } from './common/toolAuto';


// 运行webviewEvents文件夹下的index.ts，<注意>这里运行时，因进程中有import{webview}from"@/system"代码
// 会自动运行system/index.ts的顶层代码，其中的export const webview= 会自动运行得到结果，从而创建html
webviewEvents();    //这句代码打开了前端网页，因为webviewEvents文件夹下的index.ts打开了schemeList.ts
// 			依次运行了以下几个文件
// schemeList();  -------这个模块通过import { webview } from '@/system'打开了system/index.ts顶层代码和赋值代码打开了网页，
// 			且有注册返回后，监听到网页加载后setWebLoaded(true)，才能执下以下面的myFloaty.init();
//                       所以这个模块真正是入口后的网页动作模块和后续悬浮按钮的启动点
// funcList();
// settings();
// about();
// schedule();

// effect$是作业线程，当core的权限全部到位后，effect$才开始运作
// effect$.subscribe() 是响应式编程中常见的订阅模式实现
// 主要用于监听数据流的变化并执行回调逻辑。
// 非UI 线程的操作都可以在这个作业线程下进行，避免了开启多个线程。
effect$.subscribe(() => {
	// 监听放在effect里，只有当权限到位后，监听才生效
	//这个floaty位于global.d.ts中用declare声明了类型是一些检查方法的
	//declare的核心作用是在 TS 中桥接 JS 与类型系统，在 SQL 中桥接数据与逻辑，在语言中桥接意图与正式效力
	//还可以声明其他脚本（如 JavaScript 库）定义的全局标识符，避免 TS 编译器报错
	//同时根据AI提示：在AutoJS中，像floaty、console、toast等都是全局可用的内置模块，无需显式导入或实例化。
	if (floaty.checkPermission() && getWebLoaded()) {  //有悬浮窗权限  且  网页已加载
		myFloaty.init();    //这里开启了大柒的县浮按钮，用户可以在这里操作
	}

	// 这里的问号(?.)是JavaScript/TypeScript中的‌可选链操作符‌(Optional Chaining Operator)，
	// 用于安全访问可能为null或undefined的对象属性‌。具体解析如下：‌
	// 当storeSettings为null或undefined时，直接跳过后续属性访问并返回undefined，
	// 避免抛出Cannot read property 'xxx' of null/undefined错误‌。例如：
	// 传统写法（需手动判空） if (storeSettings && storeSettings.floaty_debugger_draw) {...}
	// 可选链写法（更简洁） if (storeSettings?.floaty_debugger_draw) {...}
	const storeSettings = storeCommon.get('settings', {});
	if (storeSettings?.floaty_debugger_draw) {   //如果存储设置中的floaty_debugger_draw项被启用
		drawFloaty.init();  //用于在屏幕上可视化显示自动化脚本的操作区域和检测结果。
	}
	if (storeSettings?.remote_log_url) {
		doInitHookConsoleLog(storeSettings.remote_log_url);  //远程日志调用
	}
	InputHideUtil.assistActivity(activity);    //激活输入法自适应
});
