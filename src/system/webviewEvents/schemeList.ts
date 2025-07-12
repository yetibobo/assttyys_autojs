import { fromEvent } from 'rxjs';
import { webview } from '@/system';
import store, { storeCommon } from '@/system/Store/store';
import { getWebLoaded, requestMyScreenCapture, setWebLoaded } from '@/common/toolAuto';
import { getWidthPixels, getHeightPixels } from '@auto.pro/core';
// import _ from 'lodash';
import version, { versionList } from '@/common/version';
import myFloaty from '@/system/MyFloaty';
import defaultSchemeList, { GroupSchemeName, schemeNameMap } from '@/common/schemeList';
import MyAutomator from '@/system/MyAutomator';
import helperBridge from '@/system/helperBridge';
import { IScheme } from '@/interface/IScheme';
import { deepClone } from '@/common/tool';


//运行schemelist()默认运行function webviewSchemeList
export default function webviewSchemeList() {
	// 1. 初始化schemeList，其中IScheme[]类型定义位于src/interface/IScheme.ts中，表明schemeList是含多个IScheme对象的数组
	// store.get从名为store的存储系统中get键key为'schemeList'的数据，该数据预期是一个符合IScheme接口结构的对象数组
	// 第一次运行时store内应该是个空存储桶，所以要初始化.
	// 项目使用两个主要的存储桶：
        // asttyys_ng - 主要存储桶，用于存储脚本运行数据
        // assttyys_ng_common - 通用存储桶，用于存储公共配置和设置
	// 存储桶
	// SharedPreferences 是 Android 开发中用于存储‌轻量级键值对数据‌的核心组件，其核心概念和用法如下：
	// ‌用途‌：保存简单数据（如用户设置、应用配置、登录状态等），不适合存储大量或复杂数据（如数据库、文件流）。
	// ‌存储位置‌：/data/data/<包名>/shared_prefs/ 目录下的 .xml 文件。
	// 特性	说明
	// ‌键值对存储‌	数据以 key-value 形式保存（键为String，值支持基本类型/String）。
	// ‌进程安全‌	多线程访问时自动加锁，但‌不支持多进程共享‌（需改用 ContentProvider）。
	// ‌同步/异步提交‌	commit()（同步，阻塞线程）和 apply()（异步，无返回值）。
	// ‌数据类型限制‌	仅支持：boolean、int、float、long、String、Set<String>。
	// selfStorages.create('asttyys_ng')时：数据存储位置位置通常在：
	// /data/data/{应用包名}/shared_prefs/autojs.localstorage.asttyys_ng.xml  
	let schemeList: IScheme[] = store.get('schemeList');
	if (!schemeList) {
		console.log('初始化schemeList', defaultSchemeList);
		//对象的深拷贝（Deep Clone）‌，它会递归地复制一个对象的所有层级属性，生成一个完全独立的新对象
		// defaultSchemeList位于@/common/schemeList
		schemeList = deepClone(defaultSchemeList);
		// put表示把value保存到key，value必须是可JSON化的值
		store.put('schemeList', defaultSchemeList);
	} else {
		// 升级版本数据修复
		// 遍历schemeList数组中的每个scheme对象
		// 将旧版字段groupName的值迁移到新版数组字段groupNames中（若groupName存在非空值）
		// 删除无效的空字符串groupName字段（当groupName === ''时）
		// ‌数据持久化		
		// 通过flag标记判断是否发生数据修改
		// 若发生修改则调用store.put更新存储数据
		
		let flag = false;
		for (const scheme of schemeList as (IScheme & { groupName: string })[]) {
			if (scheme.groupName) {
				flag = true;
				scheme.groupNames = [scheme.groupName];
				delete scheme.groupName;
			} else if (scheme.groupName === '') {
				flag = true;
				delete scheme.groupName;
			}
		}
		if (flag) {
			store.put('schemeList', schemeList);
		}
	}

	// 2. 初始化groupSchemeNames
	// 从store中获取名为'groupSchemeNames'的数据例如groupSchemeNames:'个人探索'
	const groupSchemeNames = store.get('groupSchemeNames'); 
	// 判断如果获取到的groupSchemeNames不存在或为空
	if (!groupSchemeNames) {
		// 创建一个空对象toSaveMap，用于临时存储分组信息
		const toSaveMap: Record<string, GroupSchemeName> = {}
		// 遍历src/common/schemeList.ts  schemeList数组中的每个scheme
		schemeList.forEach(scheme => {
			// 检查当前scheme的groupNames是否存在或为空数组，正常情况下都没有groupNames的
			if (!scheme.groupNames || !(scheme.groupNames?.length)) {
				// 如果groupNames不存在，则设置为默认值['未分组']，一开始相当于所有未分组方案都添加了未分组这个值
				scheme.groupNames = ['未分组'];
			}
			// 遍历当前scheme的所有groupNames
			scheme.groupNames.forEach(groupName => {
				// 检查toSaveMap中是否已存在该groupName，一开始肯定没有的
				if (!toSaveMap[groupName]) {
					// 如果不存在，则初始化该groupName对应的数据结构
					toSaveMap[groupName] = {
						groupName, hidden: false, schemeNames: []
					};
				}
				// 检查当前schemeName是否已存在于该groupName的schemeNames中
				if (!toSaveMap[groupName].schemeNames.includes(scheme.schemeName)) {
					// 如果不存在，则将当前schemeName添加到该groupName的schemeNames中
					toSaveMap[groupName].schemeNames.push(scheme.schemeName);
				}
			});
		});
		// 将toSaveMap转换为数组形式
		const toSave = Object.keys(toSaveMap).map(key => toSaveMap[key]);
		// 打印初始化日志
		console.log('初始化groupSchemeNames', toSave);
		// 将初始化后的数据保存回store，最后方案按组分类
		store.put('groupSchemeNames', toSave);
	}
	// 以上这段代码主要实现了：
	// 从store获取分组方案数据
	// 如果数据不存在，则根据schemeList初始化
	// 确保每个scheme都有至少一个分组
	// 构建分组到方案名称的映射关系
	// 最终将初始化结果保存回store

	

	// 返回已保存的方案列表，如果未保存过，返回common中的schemeList

	// webview.on('getSchemeList') 监听名为 getSchemeList 的事件
	// .subscribe() 方法注册回调函数，当事件触发时执行该函数
	// 参数 [_param, done] 解构出事件参数和完成回调函数 done
	// 这里[_param, done]参数相当于无参数-默认参数
	webview.on('getSchemeList').subscribe(([_param, done]) => {
		// const savedSchemeList = store.get('schemeList', defaultSchemeList);
		// savedSchemeList.forEach(item => {
		// 	item.inner = schemeNameMap[item.schemeName] || false;
		// });
		// done(savedSchemeList);
		// 通过 done(store.get('schemeList')) 直接返回存储的 schemeList 数据
		done(store.get('schemeList'));
	});

	webview.on('getGroupSchemeNames').subscribe(([_param, done]) => {
		done(store.get('groupSchemeNames'));
	});

	webview.on('getDefaultSchemeList').subscribe(([_param, done]) => {
		done(defaultSchemeList);
	});

	webview.on('getGroupNames').subscribe(([_param, done]) => {
		// const savedSchemeList = store.get('schemeList', defaultSchemeList);
		// const groupNamesMap = {};
		// savedSchemeList.forEach(s => {
		// 	if (s.groupName) groupNamesMap[s.groupName] = 1;
		// });
		// done(Object.keys(groupNamesMap));
		done(store.get('groupSchemeNames').map((groupSchemeName: GroupSchemeName) => groupSchemeName.groupName));
	});

	webview.on('saveGroupSchemeNames').subscribe(([params, done]) => {
		store.put('groupSchemeNames', params);
		done({ error: 0, message: 'success' });
	});

	// 保存方案
	webview.on('saveScheme').subscribe(([params, done]) => {
		// const savedSchemeList = store.get('schemeList', defaultSchemeList);
		// console.log(`saveScheme: ${JSON.stringify(scheme, null, 4)}`);
		// const schemeList = mergeSchemeList(savedSchemeList, defaultSchemeList);
		// for (let i = 0; i < schemeList.length; i++) {
		// 	if (schemeList[i].schemeName === scheme.schemeName) {
		// 		scheme.id = schemeList[i].id;
		// 		schemeList[i] = scheme;
		// 		break;
		// 	}
		// }
		// store.put('schemeList', schemeList);
		// done('success');
		const schemeList = store.get('schemeList');
		const { type, oldScheme, newScheme } = params;
		if (type === 'modify') {
			if (!newScheme.schemeName) {
				done({ error: 1, message: '方案名不能为空' });
				return;
			}
			const index = schemeList.findIndex((scheme: IScheme) => scheme.schemeName === oldScheme.schemeName);
			if (index === -1) {
				done({ error: 1, message: '未找到该方案' });
				return;
			}
			schemeList[index] = newScheme;
			store.put('schemeList', schemeList);
			updateGroupSchemeNamesBySchemeUpdate(params);
			done({ error: 0, message: 'success' });
			return;
		} else if (type === 'add' || type === 'copy') {
			const index = schemeList.findIndex((scheme: IScheme) => scheme.schemeName === newScheme.schemeName);
			if (!newScheme.schemeName) {
				done({ error: 1, message: '方案名不能为空' });
				return;
			}
			if (index !== -1) {
				done({ error: 1, message: '方案名重复' });
				return;
			}
			schemeList.push(newScheme);
			store.put('schemeList', schemeList);
			updateGroupSchemeNamesBySchemeUpdate(params);
			done({ error: 0, message: 'success' });
			return;
		} else if (type === 'remove') {
			const index = schemeList.findIndex((scheme: IScheme) => scheme.schemeName === oldScheme.schemeName);
			if (index === -1) {
				done({ error: 1, message: '未找到该方案' });
				return;
			}
			schemeList.splice(index, 1);
			store.put('schemeList', schemeList);
			updateGroupSchemeNamesBySchemeUpdate(params);
			done({ error: 0, message: 'success' });
			return;
		}
		done({ error: 1, message: '未知错误' });
		return;
	});

	webview.on('removeScheme').subscribe(([params, done]) => {
		const schemeList = store.get('schemeList');
		const index = schemeList.findIndex((scheme: IScheme) => scheme.schemeName === params.schemeName);
		if (index === -1) {
			return { error: 1, message: '未找到该方案' };
		}
		schemeList.splice(index, 1);
		updateGroupSchemeNamesBySchemeUpdate({
			type: 'remove', oldScheme: params, newScheme: null,
		});
		store.put('schemeList', schemeList);
		done({ error: 0, message: 'success' });
	});


	// 保存方案列表
	webview.on('saveSchemeList').subscribe(([schemeList, done]) => {
		store.put('schemeList', schemeList);
		console.log('schemeList已保存');
		// 找到被删除了的内置方案存起来
		const deletedSchemeNames = Object.keys(schemeNameMap).filter(schemeName => {
			for (const scheme of schemeList) {
				if (scheme.schemeName == schemeName) return false;
			}
			return true;
		});
		store.put('deletedSchemeNames', deletedSchemeNames);
		done('success');
	});


	/**
	 * 收藏/取消收藏方案
	 */
	webview.on('starScheme').subscribe(([opt, done]) => {
		const savedSchemeList = store.get('schemeList', defaultSchemeList);
		for (const scheme of savedSchemeList) {
			if (scheme.schemeName === opt.schemeName) {
				scheme.star = opt.star;
				done(scheme);
				store.put('schemeList', savedSchemeList);
				toastLog(`${!opt.star ? '取消' : ''}收藏成功`);
				return;
			}
		}
	});

	// 注册返回界面的事件
	// fromEvent 是 RxJS 响应式编程的核心操作符，专为处理异步事件流设计，支持链式操作和复杂的数据流转换。
	// 举例：fromEvent(document.getElementById('btn'), 'click').subscribe(() => console.log('Clicked!'));
	// webview.on 通常是 Webview 容器的原生事件监听接口，功能相对单一，主要用于基础事件监听。
	fromEvent(ui.emitter, 'resume').subscribe((_e) => {
		// 登录验证
		webview.runHtmlJS('window.resumeValidUser && window.resumeValidUser()');
		// 更新定时任务界面的数据
		webview.runHtmlJS('window.loadScheduleData && window.loadScheduleData()');
	})

	webview.on('webloaded').subscribe(([_param, done]) => {
		if (getWebLoaded()) {
			done(true);
			return;
		}
		setWebLoaded(true);
		// 界面加载完成后申请截图权限
		requestMyScreenCapture(done, helperBridge);

		// 加载完界面后再注册返回事件
		fromEvent(ui.emitter, 'back_pressed').subscribe((e: any) => {
			e.consumed = true;
			webview.runHtmlJS('window.routeBack && window.routeBack()');
		});

		// 初始化automator
		const storeSettings = storeCommon.get('settings', {});
		if (!storeSettings.tapType) {
			if (device.sdkInt >= 24) {
				storeSettings.tapType = '无障碍';
			} else {
				storeSettings.tapType = 'Root';
			}
			storeCommon.put('settings', storeSettings);
		}
		helperBridge.setAutomator(new MyAutomator(storeSettings.tapType));

		if (floaty.checkPermission()) {
			myFloaty.init();
		}
	});

	// TODO 使用core包的获取状态栏高度
	webview.on('getStatusBarHeight').subscribe(([_param, done]) => {
		const resources = context.getResources();
		const resourceId = resources.getIdentifier('status_bar_height', 'dimen', 'android');
		const statusBarHeight = resources.getDimensionPixelSize(resourceId);
		const density = context.getResources().getDisplayMetrics().density;
		done(Math.floor(statusBarHeight / density));
	});

	// 获取版本信息，前端对版本信息进行拼接，告知更新内容
	webview.on('versionInfo').subscribe(([_param, done]) => {
		// storages.remove('assttyys_ng_common');
		const storeVersion = storeCommon.get('storeVersion', null);
		storeCommon.put('storeVersion', version);
		done({
			storeVersion: storeVersion,
			versionList: versionList
		});
	});

	// 获取应用信息，每次进入app都会以弹窗形式出现
	webview.on('getAppInfo').subscribe(([_param, done]) => {
		const appMsg = '';
		const ret = { msg: appMsg };
		const w = getWidthPixels();
		const h = getHeightPixels();
		if (!(w == 1280 && h == 720) && !(w == 720 && h == 1280)) {
			ret.msg = `当前分辨率为 ${w} * ${h}, 非推荐分辨率 720 * 1280, 不保证正常运行。${appMsg}`;
		}
		done(ret);
	});

	webview.on('getClip').subscribe(([_param, done]) => {
		done(getClip());
	});

	// 提供toast给前端使用
	webview.on('toast').subscribe(([string, done]) => {
		done();
		toastLog(string);
	});

	// 退出，前端回到方案界面后返回按两次后退出
	webview.on('exit').subscribe(([_param, done]) => {
		done();
		exit();
	});
}




const updateGroupSchemeNamesBySchemeUpdate = (option: {
	oldScheme?: IScheme,
	newScheme: IScheme,
	type: 'copy' | 'modify' | 'add' | 'remove'
}): void => {
	const { type, oldScheme, newScheme } = option;
	if (oldScheme && (!oldScheme.groupNames || oldScheme.groupNames.length === 0)) {
		oldScheme.groupNames = ['未分组'];
	}
	if (newScheme && (!newScheme.groupNames || newScheme.groupNames.length === 0)) {
		newScheme.groupNames = ['未分组'];
	}

	let groupSchemeNames: GroupSchemeName[] = store.get('groupSchemeNames');
	if ('modify' === type) {
		// 直接找到原来的分组，将原来的分组中的名字修改为新的名字
		const deletedGroupSchemeNames = oldScheme.groupNames.filter(groupName => !newScheme.groupNames.includes(groupName));
		const commonGroupNames = oldScheme.groupNames.filter(groupName => newScheme.groupNames.includes(groupName));
		const addedGroupSchemeNames = newScheme.groupNames.filter(groupName => !oldScheme.groupNames.includes(groupName));
		// 1. 删除分组中删除旧的方案名
		deletedGroupSchemeNames.forEach(groupName => {
			const groupSchemeName = groupSchemeNames.find(groupSchemeName => groupSchemeName.groupName === groupName);
			if (groupSchemeName) {
				const index = groupSchemeName.schemeNames.findIndex(schemeName => schemeName === oldScheme.schemeName);
				groupSchemeName.schemeNames.splice(index, 1);
			}
		});

		// 2. 公共分组中更新方案名
		commonGroupNames.forEach(groupName => {
			const groupSchemeName = groupSchemeNames.find(groupSchemeName => groupSchemeName.groupName === groupName);
			if (groupSchemeName) {
				const index = groupSchemeName.schemeNames.findIndex(schemeName => schemeName === oldScheme.schemeName);
				groupSchemeName.schemeNames.splice(index, 1, newScheme.schemeName);
			}
		});

		// 3. 新增分组中新增方案名
		addedGroupSchemeNames.forEach(groupName => {
			const groupSchemeName = groupSchemeNames.find(groupSchemeName => groupSchemeName.groupName === groupName);
			if (!groupSchemeName) {
				groupSchemeNames.push({
					groupName, hidden: false, schemeNames: [newScheme.schemeName]
				});
			} else {
				groupSchemeName.schemeNames.push(newScheme.schemeName);
			}
		});

		// 4. 删除空分组
		groupSchemeNames = groupSchemeNames.filter(groupSchemeName => groupSchemeName.schemeNames.length > 0);
	} else if ('copy' === type || 'add' === type) {
		const addedGroupSchemeNames = newScheme.groupNames;
		// 3. 新增分组中新增方案名
		addedGroupSchemeNames.forEach(groupName => {
			const groupSchemeName = groupSchemeNames.find(groupSchemeName => groupSchemeName.groupName === groupName);
			if (!groupSchemeName) {
				groupSchemeNames.push({
					groupName, hidden: false, schemeNames: [newScheme.schemeName]
				});
			} else {
				groupSchemeName.schemeNames.push(newScheme.schemeName);
			}
		});
	} else if ('remove' === type) {
		// 1. 删除分组中删除旧的方案名
		oldScheme.groupNames.forEach(groupName => {
			const groupSchemeName = groupSchemeNames.find(groupSchemeName => groupSchemeName.groupName === groupName);
			if (groupSchemeName) {
				const index = groupSchemeName.schemeNames.findIndex(schemeName => schemeName === oldScheme.schemeName);
				groupSchemeName.schemeNames.splice(index, 1);
			}
		});

		// 4. 删除空分组
		groupSchemeNames = groupSchemeNames.filter(groupSchemeName => groupSchemeName.schemeNames.length > 0);
	}
	store.put('groupSchemeNames', groupSchemeNames);
}


// 导入依赖模块
// 文件开头导入了必要的依赖： schemeList.ts:1-4

// funcList: 功能列表索引，包含所有可用的自动化功能
// commonConfigArr: 通用配置数组
// IScheme: 方案接口类型定义
// merge: 对象合并工具函数
// 方案列表定义
// 核心的 SchemeList 数组包含了所有预定义的自动化方案： schemeList.ts:6-12

// 每个方案对象包含以下属性：

// id: 方案唯一标识符
// schemeName: 方案显示名称
// star: 是否为星标方案（常用方案）
// list: 功能ID数组，定义执行顺序
// config: 可选的功能特定配置
// commonConfig: 可选的通用配置参数
// groupNames: 可选的分组名称数组
// 典型方案示例
// 以"通用准备退出"方案为例： schemeList.ts:7-12

// 执行功能ID为 [0, 1, 2, 3] 的功能序列
// 标记为星标方案
// 复杂方案如"个人突破"包含详细配置： schemeList.ts:32-45

// 包含功能配置，如功能8的执行次数和后续操作
// 指定了突破类型参数
// 通用配置处理
// 代码构建通用配置对象： schemeList.ts:945-951

// 遍历 commonConfigArr 数组，提取每个配置项的默认值，构建全局通用配置对象。

// 功能配置映射
// 构建所有功能的默认配置映射： schemeList.ts:952-963

// 为每个功能ID创建配置对象，包含该功能的所有配置项默认值。

// 方案数据合并处理
// 最后的处理逻辑对每个方案进行数据合并： schemeList.ts:968-989

// 这段代码：

// 记录内置方案名称到 innerSchemeListName 映射
// 为每个方案的功能列表构建默认配置
// 使用 merge 函数合并默认配置和方案特定配置
// 确保每个方案都有完整的配置结构
// 导出接口
// 文件导出三个主要内容： schemeList.ts:991-997

// schemeNameMap: 内置方案名称映射
// SchemeList: 完整的方案列表（默认导出）
// GroupSchemeName: 分组方案名称类型定义
// Notes
// 这个文件在系统架构中起到配置中心的作用，被 src/system/webviewEvents/schemeList.ts 等模块引用用于方案管理。 
// schemeList.ts:9 方案列表包含了从基础的组队、个人副本到复杂的定时任务等各种自动化场景，每个方案通过功能ID序列定义执行流程，通过配置对象定制具体行为。
