runtime.unloadDex('./assets/lib/scriptlib.dex');
runtime.loadDex('./assets/lib/scriptlib.dex');

runtime.unloadDex('./assets/lib/nlp-hanzi-similar-1.3.0.dex');
runtime.loadDex('./assets/lib/nlp-hanzi-similar-1.3.0.dex');

import { isDebugPlayerRunning } from '@/common/toolAuto';
import core, { closeForeground, setSystemUiVisibility } from '@auto.pro/core'
import { run } from '@auto.pro/webview'

// $debug.setMemoryLeakDetectionEnabled(true);

// let needCap = '竖屏';
// if (getWidthPixels() > getHeightPixels()) {
//     needCap = '横屏';
// }
//  下面的core({})代码不请求任何权限，只是简单的初始化。
// 提供常用属性和方法给其他模块使用，可以接受一些参数，示例如下:
// core({
//     baseWidth: 1920,
//     baseHeight: 1080,
//     needCap: true,
//     needService: true,
//     needFloaty: true,
//     needForeground: true,
//     needStableMode: true,
// })
core({  //本身不请求任何权限
	// needCap: needCap,
	// capType: '同步',
	// needFloaty: true,
	// needService: true,
	needScreenListener: true,
	// needForeground: true,
});

// console.log(context.getExternalFilesDir(null).getAbsolutePath());
// console.log(files.cwd());
console.log(`autojs version: ${app.autojs.versionCode}`);


let url = 'https://assttyys.zzliux.cn/static/webview/'
// 调试模式，可能存在有人用run.js运行脚本，这时就得用运行路径判断了
// if (context.packageName.match(/^org.autojs.autojs(pro)?$/) && files.cwd().indexOf(context.getExternalFilesDir(null).getAbsolutePath()) === -1) {
// 	url = 'file://' + files.path('dist/index.html');
// }
// aj彻底废了。。
if (isDebugPlayerRunning()) {
	url = 'file://' + files.path('dist/index.html');
	// url = 'https://assttyys.zzliux.cn/new/'
}


// 这里解释一下为什么export const webview = run(url, {在import时会自动执行 run()
// ‌1.模块顶层执行特性‌
// 当模块中包含非声明语句（如函数调用、表达式等）时，这些代码会在模块被导入时立即执行。这里的run(url, {...})是一个直接赋值表达式，属于可执行代码而非纯声明3。
// ‌2.与IIFE的区别‌
// 虽然代码没有使用(()=>{...})()这种显式的立即执行函数表达式(IIFE)语法，但赋值语句右侧的表达式会在求值时立即执行1。这与动态导入import()的延迟执行特性形成对比。
// 3.若需延迟执行，应改为函数封装形式：
// export const Webview = () => run(url, {...})
// 这样只有在调用tWebview()时才会执行run函数4。
export const webview = run(url, {
	// fitsSystemWindows: 'true',
	afterLayout() {  //afterLayout: Function 有时要紧跟着布局做系统初始化，可以放在这个函数里
		if (device.sdkInt >= 23) { // SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
			setSystemUiVisibility('有状态栏的沉浸式界面')
		}
		activity.getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);  //实现了将Android应用的状态栏颜色设置为透明的功能。
	},
	// 以上这里首先检查Android SDK版本，如果是API 23（Android 6.0）及以上，会设置 SYSTEM_UI_FLAG_LIGHT_STATUS_BAR 标志，然后将状态栏颜色设为透明

	
	// 自定义 WebChromeClient 的事件，它的常用事件有
	// onCreateWindow打开新窗口时的回调
	// onCloseWindow关闭窗口时的回调
	// onJsAlert监听 alert
	// onJsConfirm监听 confirm
	// onJsPrompt监听 prompt(本模块通过这个事件来通信)
	// onProgressChanged 网页的加载进度改变时的回调
	chromeClientOption: {  
		onConsoleMessage: function (msg) {
			console.log(msg.message());
		}
	},

	// webviewClientOption: object 自定义 WebViewClient 的事件，它的常用事件有
	// onPagestarted 网页开始加载时的回调
	// onPageFinished网页加载结束的回调
	// shouldOverrideUrlLoading拦截 url 跳转
	// onReceivedError 错误回调
	// onReceivedSslError  https 错误回调
	webviewClientOption: {
		shouldOverrideUrlLoading: function (view, url) {
			if (url) {
				console.log(`[shouldOverrideUrlLoading]: 跳转至${url.getUrl()}`);
				view.loadUrl(url.getUrl());
			}
			return true;
		},
		//     shouldInterceptRequest(webView, webResourceRequest) {
		//         let input;
		//         const url = webResourceRequest.getUrl().toString();
		//         const key = 'https://local_resources';
		//         /*如果请求包含约定的字段 说明是要拿本地的图片*/
		//         if (url.contains(key)) {
		//             const filePath = url.replace(new RegExp(`^${key.replace('/', '\\/')}\/`), '');
		//             console.log(filePath);
		//             try {
		//                 /*重新构造WebResourceResponse  将数据已流的方式传入*/
		//                 input = new java.io.FileInputStream(new java.io.File(filePath));
		//                 let response = new android.webkit.WebResourceResponse('text/plain', 'UTF-8', input);
		//                 if (key === 'https://local_resources_image_png') {
		//                     response = new android.webkit.WebResourceResponse('image/png', 'UTF-8', input);
		//                 }

		//                 /*返回WebResourceResponse*/
		//                 return response;
		//             } catch (e) {
		//                 console.error($debug.getStackTrace(e));
		//             }
		//         }
		//         return this$super.shouldInterceptRequest(webView, webResourceRequest);
		//     }
	}
});
webview.webviewObject.clearCache(true);
// webview.webviewObject.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
// webview.webviewObject.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null); // 开启硬件加速

// 监听退出事件，关闭前台服务
events.on('exit', () => {
	closeForeground()
})

// // 监听返回键并共享事件
// const back$ = fromEvent(ui.emitter, 'back_pressed').pipe(share())
// back$.pipe(
//     exhaustMap((e) => {
//         toast('再次返回可退出')
//         e.consumed = true
//         return race(
//             back$.pipe(tap(() => (e.consumed = false))),
//             timer(2000)
//         )
//     })
// ).subscribe()


// webview.on本身就是事件注册，然后前端vue.js通过webview.call对应这个注册事件来调用动作

// webview.on 事件处理主要分布在以下几个模块中：
// 1方案管理相关事件 (schemeList.ts) schemeList.ts:65-71
// getSchemeList: 获取已保存的方案列表
// getGroupSchemeNames: 获取分组方案名称
// getDefaultSchemeList: 获取默认方案列表
// getGroupNames: 获取分组名称
// saveGroupSchemeNames: 保存分组方案名称
// saveScheme: 保存方案（支持新增、修改、复制、删除）
// removeScheme: 删除方案
// saveSchemeList: 保存整个方案列表
// starScheme: 收藏/取消收藏方案 schemeList.ts:214-221

// 2界面相关事件： webloaded: 界面加载完成后的初始化
// getStatusBarHeight: 获取状态栏高度
// versionInfo: 获取版本信息
// getAppInfo: 获取应用信息
// getClip: 获取剪贴板内容
// toast: 显示提示信息
// exit: 退出应用

// 3功能列表相关事件： (funcList.ts) funcList.ts:14-28
// getScheme: 根据方案名获取方案
// getDefaultScheme: 获取默认方案
// setCurrentScheme: 设置当前方案
// launchPackage: 根据包名启动应用
// startCurrentScheme: 启动当前方案
// getFuncList: 获取功能列表
// getCommonConfig: 获取通用配置
// startScript: 启动脚本

//4 设置相关事件 (settings.ts) settings.ts:89-90
// getSettings: 获取配置列表
// saveSetting: 保存配置
// startActivityForLog: 打开日志
// clearStorage: 清空存储
// getToSetDefaultLaunchAppList: 获取默认启动应用列表
// getIconByPackageName: 根据包名获取应用图标
// saveToSetDefaultLaunchAppList: 保存默认启动应用列表 settings.ts:621-640

//5 异型屏相关：
// getShapedScreenConfig: 获取异型屏兼容配置
// setShapedScreenConfigEnabled: 设置异型屏兼容配置

// 6其他设置：
// openURL: 打开URL
// getDeviceId: 获取设备ID
// getToFloat: 获取悬浮窗配置
// saveToFloat: 保存悬浮窗配置

// 7定时任务相关事件 (schedule.ts) schedule.ts:53-56
// getScheduleList: 获取定时任务列表
// saveScheduleList: 保存定时任务列表
// getScheduleInstance: 获取调度实例
// setScheduleLazyMode: 设置懒惰模式
// getScheduleLazyMode: 获取懒惰模式
// scheduleChange: 定时任务变更

// 8关于页面相关事件 (about.ts) about.ts:5-8
// openOpenSource: 打开开源地址
// mailTo: 发送邮件
// copyToClip: 复制到剪贴板
// copyPToClip: 复制加群链接到剪贴板

// Notes
// 这些 webview 事件构成了完整的前后端通信体系，涵盖了方案管理、功能执行、系统设置、
// 定时任务和应用信息等核心功能模块。 每个事件都使用 subscribe 模式处理，通过 done 
// 回调返回结果给前端。
