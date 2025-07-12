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
		store.put('schemeList', defaultSchemeList);
	} else {
		// 升级版本数据修复
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
	const groupSchemeNames = store.get('groupSchemeNames');
	if (!groupSchemeNames) {
		const toSaveMap: Record<string, GroupSchemeName> = {}
		schemeList.forEach(scheme => {
			if (!scheme.groupNames || !(scheme.groupNames?.length)) {
				scheme.groupNames = ['未分组'];
			}
			scheme.groupNames.forEach(groupName => {
				if (!toSaveMap[groupName]) {
					toSaveMap[groupName] = {
						groupName, hidden: false, schemeNames: []
					};
				}
				if (!toSaveMap[groupName].schemeNames.includes(scheme.schemeName)) {
					toSaveMap[groupName].schemeNames.push(scheme.schemeName);
				}
			});
		});
		const toSave = Object.keys(toSaveMap).map(key => toSaveMap[key]);
		console.log('初始化groupSchemeNames', toSave);
		store.put('groupSchemeNames', toSave);
	}

	// 返回已保存的方案列表，如果未保存过，返回common中的schemeList
	webview.on('getSchemeList').subscribe(([_param, done]) => {
		// const savedSchemeList = store.get('schemeList', defaultSchemeList);
		// savedSchemeList.forEach(item => {
		// 	item.inner = schemeNameMap[item.schemeName] || false;
		// });
		// done(savedSchemeList);
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
