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
webviewEvents();

// effect$是作业线程，当core的权限全部到位后，effect$才开始运作
effect$.subscribe(() => {
	// 监听放在effect里，只有当权限到位后，监听才生效
	if (floaty.checkPermission() && getWebLoaded()) {
		myFloaty.init();
	}
	const storeSettings = storeCommon.get('settings', {});
	if (storeSettings?.floaty_debugger_draw) {
		drawFloaty.init();
	}
	if (storeSettings?.remote_log_url) {
		doInitHookConsoleLog(storeSettings.remote_log_url);
	}
	InputHideUtil.assistActivity(activity);
});
