// require('@/system/FloatButton/FloatButton');
import FloatButton from '@/system/FloatButton/FloatButton';
import schemeDialog from '@/system/schemeDialog';
import script from '@/system/script';
import { showScheduleDialog } from '@/system/Schedule/scheduleDialog';
import { storeCommon } from '@/system/Store/store';

/**
 * 对大柒开发的 FloatButton 库进行了封装，就是配置好了的 FloatButton，为自动化系统提供了便捷的悬浮控制界面
 * 这里虽然MyFloaty 被定义为一个类，但文件同时导出了一个实例：export default new MyFloaty();
 * 这意味着 MyFloaty.ts 文件导出的是一个已经实例化的对象，而不是类本身。
 * 悬浮按钮实例，共6个按钮，定义了事件，对大柒的悬浮按钮进行封装，同时导入了@/system/script脚本执行模块，可根据注册事件执行脚本
 */
	// 根据代码分析，MyFloaty.ts 主要注册了以下几类响应事件：

	// 按钮点击事件
	// MyFloaty 为每个悬浮按钮注册了 onClick 事件处理器：
	// RunStop 按钮： MyFloaty.ts:60-77
	// SchemeListMenu 按钮： MyFloaty.ts:87-92
	// SchemeAutoRun 按钮： MyFloaty.ts:101-106
	// CapScreen 按钮（可选）： MyFloaty.ts:113-128
	// ViewLogConsole 按钮（可选）： MyFloaty.ts:136-145
	// ScheduleList 按钮（可选）： MyFloaty.ts:154-156

	// 脚本引擎回调事件
	// MyFloaty 还注册了与脚本引擎相关的回调事件：
	// 运行回调事件： MyFloaty.ts:167-178
	// 停止回调事件： MyFloaty.ts:180-191

	// 事件处理机制
	// 这些事件通过底层的 FloatButton 系统进行管理。<<每个按钮的点击事件都会>>：
	// 1.执行相应的功能逻辑
	// 2.管理 runEventFlag 状态防止重复触发
	// 3.返回 false 来关闭菜单

	// 脚本引擎的回调事件则用于同步悬浮按钮的视觉状态，包括按钮选中状态和 logo 颜色变化。

	// Notes： MyFloaty.ts 本身不直接处理底层的触摸事件或窗口事件，这些由 FloatButton.js 系统处理。
	// MyFloaty 主要负责业务逻辑层面的事件响应，将用户操作转换为具体的自动化功能调用。

export class MyFloaty {
	fb: any;
	runEventFlag: boolean = false;
	init() {
		const storeSettings = storeCommon.get('settings', {});
		const trueCount = storeSettings.defaultFloat.filter(item => item.referred === true).length;
		if (this.fb) return;
		const self = this;
		this.fb = new FloatButton();
		this.fb.setMenuOpenAngle(180);
		this.fb.setAllButtonSize(30);
		if (trueCount > 1) {
			this.fb.setMenuRadius(40);
		} else {
			this.fb.setMenuRadius(34);
		}
		this.fb.setIcon('file://' + files.cwd() + '/assets/img/ay.png');
		this.fb.setColor('#FFFFFF');
		this.fb.setAutoCloseMenuTime(3000);
		// this.fb.addItem('Home')
		//     //设置图标
		//     .setIcon('@drawable/ic_home_black_48dp')
		//     //图标着色
		//     .setTint('#FFFFFF')
		//     //背景颜色
		//     .setColor('#0099FF')
		//     //点击事件
		//     .onClick((_view, _name) => {
		//         self.runEventFlag = false;
		//         script.stop();
		//         var i = new android.content.Intent(activity, activity.class);
		//         i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
		//         i.addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
		//         context.startActivity(i);
		//         return false;
		//     });



		const runStopItem = this.fb.addItem('RunStop');
		// 启用复选框属性
		runStopItem.toCheckbox(mUtil => {
			// 未选中样式
			mUtil.icon1('@drawable/ic_play_arrow_black_48dp').tint1('#FFFFFF').color1('#08BC92');
			// 选中样式
			mUtil.icon2('@drawable/ic_stop_black_48dp').tint2('#FFFFFF').color2('#DC1C2C');
		})
			// 设置属性为选中 第一种
			// .setChecked(true)
			.onClick((view, name, state) => {
				if (self.runEventFlag) {
					self.runEventFlag = false;
					return;
				}
				if (state) {
					const storeSettings = storeCommon.get('settings', {});
					if (storeSettings.floaty_scheme_openApp) {
						script.launchRelatedApp();  //运行关联APP
					}
					self.thisRun();
				} else {
					self.thisStop();
				}
				self.runEventFlag = false;
				// 返回 true:保持菜单开启 false:关闭菜单
				return false;
			});

		this.fb.addItem('SchemeListMenu')
			// 设置图标
			.setIcon('@drawable/ic_format_indent_increase_black_48dp')
			// 图标着色
			.setTint('#FFFFFF')
			// 背景颜色
			.setColor('#bfc1c0')
			// 点击事件
			.onClick((_view, _name) => {
				script.stop();
				schemeDialog.show(this);   //创建一个包含方案列表的UI对话框
				self.runEventFlag = false;
				return false;
			});

		this.fb.addItem('SchemeAutoRun')
			.setIcon('@drawable/ic_playlist_play_black_48dp')
			// 图标着色
			.setTint('#FFFFFF')
			// 背景颜色
			.setColor('#FF9933')
			// 点击事件
			.onClick((_view, _name) => {
				script.stop();
				self.thisRun('autoRun');
				self.runEventFlag = false;
				return false;
			});
		if (storeSettings.defaultFloat.find(item => item.floatyName === '截图图标' && item.referred === true)) {
			this.fb.addItem('CapScreen')
				.setIcon('@drawable/ic_landscape_black_48dp')
				// 图标着色
				.setTint('#FFFFFF')
				.setColor('#FF3300')
				.onClick((_view, _name) => {
					threads.start(function () {
						sleep(600);
						script.keepScreen(); // 更新图片
						const bmp = script.helperBridge.helper.GetBitmap();
						const img = com.stardust.autojs.core.image.ImageWrapper.ofBitmap(bmp);
						const path = `/sdcard/assttyys/screenshot/${new Date().getTime()}.png`;
						files.ensureDir(path);
						img.saveTo(path);
						img.recycle();
						bmp.recycle();
						media.scanFile(path);
						script.myToast(`截图已保存至${path}`);
					});
					return false;
				});
		}
		if (storeSettings.defaultFloat.find(item => item.floatyName === '日志图标' && item.referred === true)) {
			this.fb.addItem('ViewLogConsole')
				.setIcon('@drawable/ic_assignment_black_48dp')
				// 图标着色
				.setTint('#FFFFFF')
				.setColor('#FFCCCC')
				.onClick((_view, _name) => {
					const i = new android.content.Intent(activity, activity.class);
					i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
					i.addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
					context.startActivity(i);
					setTimeout(() => {
						app.startActivity('console');
					}, 500);
					return false;
				});
		}

		if ($device.sdkInt >= 23 && storeSettings.defaultFloat.find(item => item.floatyName === '定时图标' && item.referred === true)) { // android 6
			this.fb.addItem('ScheduleList')
				.setIcon('@drawable/ic_list_black_48dp')
				// 图标着色
				.setTint('#FFFFFF')
				.setColor('#FF66CC')
				.onClick((_view, _name) => {
					showScheduleDialog();
				});
		}
		if (trueCount > 1) {
			this.fb.setAllButtonPadding(8);
		} else {
			this.fb.setAllButtonPadding(6);
		}
		this.fb.getViewUtil('logo').setPadding(0);
		this.fb.setColor('#00000000');
		this.fb.show();

		script.setRunCallback(function () {
			self.runEventFlag = true;
			setTimeout(() => {
				self.runEventFlag = false;
			}, 500);
			runStopItem.setChecked(true);
			// self.fb.setTint('#ff08bc92');
			ui.run(function () {
				// @ts-expect-error d.ts文件问题
				self.fb.getView('logo').setColorFilter(colors.argb(255, 0x08, 0xbc, 0x92));
			});
		});

		script.setStopCallback(function () {
			self.runEventFlag = true;
			setTimeout(() => {
				self.runEventFlag = false;
			}, 500);
			runStopItem.setChecked(false);
			// self.fb.setTint('#00000000');
			ui.run(function () {
				// @ts-expect-error d.ts文件问题
				self.fb.getView('logo').setColorFilter(colors.argb(0, 0, 0, 0));
			});
		});
	}


	// 	thisRun 核心功能
	// thisRun 方法实现了带权限检查的脚本启动功能： MyFloaty.ts:194-209
	
	// 功能分析
	// 1. 参数处理
	// 方法接收一个可选的 type 参数，默认值为 'run'。这个参数决定了调用 script 对象的哪个方法（run 或 autoRun）。
	
	// 2. 版本检查和权限验证
	// 对于 Auto.js Pro 版本 >= 8081200 的情况，方法会检查截图权限：
	
	// 通过 images.getScreenCaptureOptions() 获取截图选项
	// 如果返回 null，说明没有截图权限，会显示 "无截图权限" 的提示
	// 无论是否有权限，都会继续执行脚本
	// 3. 脚本执行
	// 最终都会调用 script[type](this)，其中：
	
	// type 可能是 'run' 或 'autoRun'
	// this 指向当前 MyFloaty 实例，传递给脚本系统
	thisRun(type?: string) {
		// 这个||<逻辑或>用来设置默认值
		// 如果 type 有值（非空、非 undefined、非 null），则使用 type 的值
		// 如果 type 为空值（undefined、null、空字符串等），则使用 'run' 作为默认值
		type = type || 'run';
		if (app.autojs.versionCode >= 8081200) {
			// @ts-expect-error d.ts文件问题
			const capOpt = images.getScreenCaptureOptions();
			// 通过报错来切换图标状态,null == capOpt 检查 capOpt 是否为 null。当 images.getScreenCaptureOptions() 返回 null 时，说明没有截图权限
			if (null == capOpt) {

				// script[type](this); 这行代码中方括号 [type] 的含义。
				// 动态属性访问语法
				// 这是 JavaScript/TypeScript 中的动态属性访问语法。script[type] 等价于 script.type，但允许使用变量来动态确定要访问的属性名。
				// 在 MyFloaty.ts 中的具体使用
				// 在 src/system/MyFloaty.ts:194-209 的 thisRun 方法中，您可以看到这个用法：
				// thisRun(type?: string) {  
				//     type = type || 'run';  
				//     // ...  
				//     script[type](this);  
				// }
				// 这里的 type 是一个字符串变量，其值可能是：
				// 'run' - 调用 script.run(this)
				// 'autoRun' - 调用 script.autoRun(this)
				// Script 类中对应的方法
				// 在 Script 类中确实存在这些方法：
				// run() 方法：src/system/script.ts:523-526
				// autoRun() 方法：src/system/script.ts:612-654
				// 实际调用场景
				// 这种动态调用在悬浮按钮系统中被使用：
				// 普通运行：当用户点击 RunStop 按钮时，type 为 'run'，执行 script.run(this)
				// 自动运行：当用户点击 SchemeAutoRun 按钮时，type 为 'autoRun'，执行 script.autoRun(this)
				// 这种设计允许同一个 thisRun 方法根据传入的参数动态调用不同的脚本执行方法，避免了代码重复。
				script[type](this);
				toastLog('无截图权限');
			} else {
				script[type](this);
			}
		} else {
			script[type](this);
		}
	}

	thisStop() {
		script.stop();
	}
}

export default new MyFloaty();
