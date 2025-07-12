import schemeList from '@/system/webviewEvents/schemeList';
import funcList from '@/system/webviewEvents/funcList';
import settings from '@/system/webviewEvents/settings';
import about from '@/system/webviewEvents/about';
import schedule from '@/system/webviewEvents/schedule';

export default function webviewEvents() {
	// 读取/src/common/schemeList.ts内容并分组
	schemeList();
	// 获取、保存方案，关联启动等
	funcList();
	// 设置无障碍、前台、ORC、电池、悬浮窗权限等
	settings();
	// 打开注册界面时相应的点击动作反馈，邮箱、QQ群、打开注册页面等动作
	about();
	// 计划任务
	schedule();
}

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
