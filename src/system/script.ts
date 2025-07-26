import { merge } from '@/common/tool';    //深度合并
import store, { storeCommon } from '@/system/Store/store';
import funcList from '@/common/funcListIndex';
import defaultSchemeList from '@/common/schemeList';
import helperBridge, { IhelperBridge } from '@/system/helperBridge';
import multiFindColors from '@/common/multiFindColors';
import multiDetectColors from '@/common/multiDetectColors';
import { IOcr, IOcrDetector, OcrResult } from './Ocr/IOcr';
import { mlkitOcr } from '@/system/Ocr/MlkitOcr';
import { mlkitOcr2 } from '@/system/Ocr/MlkitOcr2';
import { yunxiOcr } from '@/system/Ocr/YunxiOcr';
import { setCurrentScheme } from '@/common/tool';
import { getWidthPixels, getHeightPixels } from '@auto.pro/core';
import schemeDialog from './schemeDialog';
import drawFloaty from '@/system/drawFloaty';
import { myToast, doPush, questionSearch, search } from '@/common/toolAuto';
import { IFunc, IFuncOrigin } from '@/interface/IFunc';
import { IScheme } from '@/interface/IScheme';
import { IMultiDetectColors, IMultiFindColors } from '@/interface/IMultiColor';
import { globalRoot, globalRootType } from '@/system/GlobalStore/index';
import schedule, { Job } from '@/system/Schedule';
import { MyFloaty } from '@/system/MyFloaty';
import ncnnBgyx from '@/system/ncnn/ncnnBgyx';
import { commonConfigVal } from '@/common/commonConfig';

/**
 * 脚本对象，一个程序只能有一个
 */

// 注意这里虽然建创了一个Script类，但最后
// const script = new Script();export default script;
// 导出的只是一个实例，本项目也仅用了一个脚本实例


// 模块中每个方法的功能实现。这个文件是 ASSTTYYS NG 项目的核心脚本执行引擎，包含了自动化系统的主要功能。
// 核心类结构
// Script 类是整个自动化系统的中央控制器， 定义了所有必要的属性和状态管理。
// 主要方法功能分析

// OCR 相关方法
// initOcrIfNeeded() - 根据设置动态初始化不同类型的OCR检测器（MlkitOcr、MlkitOcr2、YunxiOcr）
// getOcrDetector() 和 getOcr() - 获取OCR检测器实例，确保只在第一次调用时初始化
// findText() - 在指定区域内查找文本，支持超时和匹配模式设置
// findNum() - 专门用于查找数字的方法，会对识别结果进行字符修正（如将s/S替换为5）
// findTextWithCompareColor() - 先进行多点比色验证场景，再执行文本查找的组合方法
// findTextByOcrResult() - 在已有OCR结果中查找特定文本

// 截图和图像处理方法
// keepScreen() - script.ts:207-214 控制截图功能，可选择是否初始化红色通道以提高多点找色效率
// initRedList() - 初始化红色通道数据，用于优化多点找色性能

// 功能列表和配置管理
// getFuncList() - 根据方案获取功能列表，并将坐标从开发分辨率转换为运行分辨率
// initFuncList() - 初始化当前方案的功能列表
// initMultiDetectColors() 和 initMultiFindColors() - script.ts:320-354 初始化多点比色和多点找色配置，进行坐标转换

// 多点找色和比色方法
// findMultiColor() - 执行多点找色操作
// findMultiColorLoop() - script.ts:485-496 循环执行多点找色直到成功或超时
// compareColorLoop() - script.ts:505-517 循环执行多点比色直到满足条件

// 脚本执行控制方法
// run() - script.ts:523-526 公共接口，设置当前方案并启动脚本执行
// _run() - script.ts:536-603 内部执行方法，创建执行线程并在无限循环中执行功能列表
// autoRun() - script.ts:612-654 智能运行方法，根据当前界面自动选择合适的方案执行
// stop() 和 _stop() - script.ts:659-680 停止脚本执行，包括公共接口和内部实现
// rerun() - 重新运行脚本，支持切换方案、返回上个方案等特殊操作

// 核心操作方法
// oper() - script.ts:731-801 最关键的操作方法，执行多点比色并根据结果进行点击操作
// desc() - 执行功能的多点比色检测，判断当前界面是否匹配

// 方案和配置管理
// setCurrentScheme() - script.ts:833-844 设置当前执行方案和运行时参数
// search() 和 questionSearch() - 提供搜索功能，包括逢魔密信题库搜索

// 应用管理方法
// launchRelatedApp() - script.ts:855-864 启动关联应用
// stopRelatedApp() - script.ts:866-904 停止关联应用，支持多种停止模式

// 交互操作方法
// regionClick() - script.ts:906-910 区域点击操作
// regionSwipe() 和 regionBezierSwipe() - script.ts:912-922 滑动操作，包括普通滑动和贝塞尔曲线滑动

// 回调管理方法
// setRunCallback() 和 setStopCallback() - 设置脚本启动和停止时的回调函数

// 单例实现
// 文件末尾 script.ts:925-942 创建了单例实例并设置了事件监听器，确保整个应用只有一个脚本执行引擎。

export class Script {
	runThread: any; // 脚本运行线程
	runCallback: Function; // 运行后回调，一般用于修改悬浮样式
	stopCallback: Function; // 停止后回调，异常停止、手动停止，在停止后都会调用
	scheme: IScheme; // 运行的方案
	schemeHistory: IScheme[]; // 历史运行方案，run时push进去，stop清空，stop(true)不清
	funcMap: { [key: number]: IFunc | IFuncOrigin }; // funcList的Map形式，下标为id，值为对应的fun元素
	scheduleMap: any;  // 定时任务实例存放Map
	multiFindColors: IMultiFindColors; // 多点找色用的，提前初始化，减轻运行中计算量
	multiDetectColors: IMultiDetectColors; // 多点比色用的，提前初始化，减轻运行中的计算量
	hasRedList: boolean; // KeepScreen(true)时会初始化redList，如果没有初始化的话这个值为false，方便在有需要的时候初始化redlist且不重复初始化
	runDate: Date; // 运行启动时间
	currentDate: Date; // 最近一次功能执行时间
	lastFuncDateTime: Date; // 上次功能执行时间
	ocrDetector: IOcrDetector; // yunxi的ocr
	ocr: IOcr;
	helperBridge: IhelperBridge; // IhelperBridge;
	job: Job;
	schedule: typeof schedule;
	ncnnBgyx = ncnnBgyx;

	/**
	 * 运行次数，下标为funcList中的id，值为这个func成功执行的次数；
	 * 成功执行：多点比色成功或operatorFun返回为true
	 */
	runTimes: Record<string, number>;
	lastFunc: number; // 最后执行成功的funcId
	global: globalRootType; // 每次启动重置为空对象，用于功能里面存变量

	/**
	 * @description 方案运行中参数
	 */
	runtimeParams: Record<string, unknown> | null;

	// 设备信息
	device: any;
	storeCommon: any;

	/**
	 * 发起消息推送
	 * @param {Script} thisScript
	 * @param options
	 */

	//初始化doPush 属性，在具体下面this.doPush 被赋值为从 @/common/toolAuto 导入的 doPush 函数
	doPush: (thisScript: Script, options: {
		text: string,
		before?: () => void,
		after?: () => void
	}) => void;

	/**
	 * @description 消息提示
	 * @param {string}str
	 */
	myToast: (str: string, duration?: number) => void;

	constructor() {
		this.runThread = null;
		this.runCallback = null;
		this.stopCallback = null;
		this.scheme = null;
		this.schemeHistory = [];
		this.funcMap = null;
		this.scheduleMap = null;
		this.multiFindColors = null;
		this.hasRedList = false;
		this.runDate = null;
		this.currentDate = null;
		this.lastFuncDateTime = null;
		this.ocrDetector = null;
		this.runtimeParams = null;

		this.runTimes = {};
		this.lastFunc = null; // 最后执行成功的funcId
		this.global = merge({}, globalRoot); // 每次启动重置为空对象，用于功能里面存变量
		this.device = {
			width: getWidthPixels(),
			height: getHeightPixels()
		};
		this.helperBridge = helperBridge;
		this.storeCommon = storeCommon;

		// 推送通知会发送到以下外部服务之一，而不是在应用UI界面显示：
		// 1. oneBot推送 - 发送到QQ机器人或其他oneBot兼容服务
		// 2. Gotify推送 - 发送到自建的Gotify推送服务器 GotifyPushClient.ts:25-46
		// 3. pushplus推送 - 发送到pushplus推送服务，支持微信等多种通知方式
		this.doPush = doPush;    //doPush 属性在 Script 类构造函数中被赋值为从 @/common/toolAuto 导入的 doPush 函数

		// UI线程中显示Toast - 通过 @/common/toolAuto中的 ui.run() 确保Toast在UI线程中显示，
		// 调用内部的 _toast 函数来创建Android原生Toast toolAuto.ts:82-103
		// 控制台日志记录 - 同时将消息输出到控制台，方便调试和日志追踪
		// 在项目中的广泛使用
		// 这个函数在整个自动化系统中被大量使用：
		this.myToast = myToast;

		// 导入src\system\Schedule\index.ts  计划任务
		this.schedule = schedule;
	}


	//OCR动态初始化和切换功能
	initOcrIfNeeded() {
		const storeSettings = storeCommon.get('settings', {});
		if (!this.ocrDetector || storeSettings.ocrType !== this.ocr.typeName) {
			if (storeSettings.ocrType === 'MlkitOcr') {
				this.ocrDetector = mlkitOcr.prepare();
				this.ocr = mlkitOcr;
			} else if (storeSettings.ocrType === 'MlkitOcr2') {
				this.ocrDetector = mlkitOcr2.prepare();
				this.ocr = mlkitOcr2;
			} else if (storeSettings.ocrType === 'YunxiOcr') {
				this.ocrDetector = yunxiOcr.prepare();
				this.ocr = yunxiOcr;
			}
		}
	}

	// 获取ocr对象，重复调用仅在第一次进行实例化
	getOcrDetector(): IOcrDetector {
		this.initOcrIfNeeded();
		return this.ocrDetector;
	}

	getOcr(): IOcr {
		this.initOcrIfNeeded();
		return this.ocr;
	}


	// 	初始化OCR检测器：调用 this.initOcrIfNeeded() 确保OCR检测器已正确初始化
	// 获取OCR实例：通过 this.getOcr() 获取当前配置的OCR实现（支持MlkitOcr、MlkitOcr2、YunxiOcr三种类型）
	// 执行文本查找：调用OCR实例的 findText 方法，传入一个获取屏幕截图的回调函数
	// 其 findText 方法会循环调用这个回调函数获取截图，直到找到匹配的文本或超时

	// 	尖括号 < > 用于表示‌泛型类型参数‌，具体作用如下：
	// ‌Array<number> 和 Array<OcrResult>‌
	// 表示数组的元素类型，例如 Array<number> 指该数组仅包含数字类型元素，
	// Array<OcrResult> 指返回的数组元素为 OcrResult 类型的对象。
	// 这是TypeScript或现代JavaScript中的泛型语法，用于增强类型安全性1113。
	// ‌泛型的优势 提供编译时类型检查，避免运行时类型错误。

	// text: 要查找的目标文本
	// timeout: 超时时间（毫秒）
	// region: 搜索区域坐标数组 [x1, y1, x2, y2]
	// textMatchMode: 文本匹配模式（如"包含"、"模糊"等）
	
	findText(text: string, timeout: number, region: Array<number>, textMatchMode: string): Array<OcrResult> {
		this.initOcrIfNeeded();
		return this.getOcr().findText(function () {
			script.keepScreen(); // 更新图片
			return script.helperBridge.helper.GetBitmap(); // 返回bmp
		}, text, timeout, region, textMatchMode);
	}



	//            Array<OcrResult>
	//关于Ocr执行后返回的对对像，是一个OcrResult 结构的对像
	// OcrResult 对象包含以下属性：
	// label: 识别出的文本内容
	// confidence: 识别置信度
	// points: 文本在屏幕上的坐标点数组
	// similar: 相似度（在模糊匹配时使用）


	// findNum 方法实现了专门用于识别和提取数字的OCR功能，它基于 findText 方法但增加了数字识别的特殊处理逻辑。
	// 核心实现流程
	// 该方法的执行流程如下：
	// 初始化OCR检测器：调用 this.initOcrIfNeeded() 确保OCR检测器已正确初始化
	// 执行数字文本查找：使用正则表达式 '\\d+' 作为搜索模式，以"包含"模式查找所有数字文本
	// 字符纠错处理：对识别结果进行字符替换，修正OCR常见的识别错误：
	// s/S → 5
	// o/O → 0
	// z/Z → 2
	// 结果过滤：只保留纯数字的识别结果，使用正则表达式 ^\d+$ 验证 
	// 截图获取机制
	// 与 findText 方法相同，使用回调函数获取屏幕截图
	
	findNum(timeout: number, region: Array<number>): Array<OcrResult> {
		this.initOcrIfNeeded();
		return this.getOcr().findText(function () {
			script.keepScreen(); // 更新图片
			return script.helperBridge.helper.GetBitmap(); // 返回bmp
		}, '\\d+', timeout, region, '包含').filter(item => {
			item.label = item.label
				.replace(/[sS]/g, '5')
				.replace(/[oO]/g, '0')
				.replace(/[zZ]/g, '2');
			if (item.label.match(/^\d+$/)) {
				return true;
			}
			return false;
		});
	}

	/**
	 * 通过 this.oper(currFunc) 先进行颜色比较验证当前场景是否正确，避免在错误场景下执行耗时的OCR操作。
  	 * 先比色，再findText
	 * 参数说明
	 * text: 要查找的目标文本
	 * timeout: 总超时时间（毫秒）
	 * region: 搜索区域坐标数组
	 * textMatchMode: 文本匹配模式
	 * currFunc: 当前功能配置，用于场景验证
	 */
	findTextWithCompareColor(text: string, timeout: number, region: Array<number>, textMatchMode: string, currFunc: IFunc): Array<OcrResult> {
		this.initOcrIfNeeded();
		const self = this;
		const startTime = new Date().getTime();
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// 先判断场景，场景不对就直接返回空
			if (!this.oper(currFunc)) return [];

			// 超时时间设置为0，表示找一次就行，由外部手工控制循环
			const result = this.getOcr().findText(function () {
				self.keepScreen(); // 更新图片
				return self.helperBridge.helper.GetBitmap(); // 返回bmp
			}, text, 0, region, textMatchMode);     //返回result的值为OcrResult数组

			if (result.length !== 0) {
				return result;
			}
			// 超时退出
			if (new Date().getTime() - startTime > timeout) {
				return [];
			}
			// 使用循环延时作为sleep，防止一直在执行ocr导致cpu占用过高
			sleep(this.scheme.commonConfig.loopDelay as number);
		}
	}


	// findTextByOcrResult 方法实现了基于已有OCR识别结果进行文本匹配的功能，
	// 它不会重新进行屏幕截图和OCR识别，而是直接在现有的OCR结果中查找匹配的文本。
	// 返回一个文本数组
	findTextByOcrResult(text: string, ocrResult: Array<OcrResult>, textMatchMode: string, similarityRatio?: number): Array<OcrResult> {
		this.initOcrIfNeeded();
		return this.getOcr().findTextByOcrResult(text, ocrResult, textMatchMode, similarityRatio);
	}

	/**
	 * 截图，mode为true时表示对红色通过作为下标进行初始化，但执行需要一定时间，
	 * 对截图进行一次初始化后可大幅提高多点找色效率，通常初始化一次红色通道后进行多次多点找色
	 * 仅使用多点比色时mode给false或不传
	 * @param {Boolean} mode
	 */
	keepScreen(mode?: boolean) {
		helperBridge.helper.KeepScreen(mode || false);
		if (mode) {
			this.hasRedList = true;
		} else {
			this.hasRedList = false;
		}
	}

	/**
	 * 初始化红色通道
	 */
	initRedList() {
		if (!this.hasRedList) {
			helperBridge.helper.GetRedList();
			this.hasRedList = true;
		}
	}

	/**
	 * 设置启动后回调
	 * @param {Function} callback
	 */

	// setRunCallback 方法用于设置脚本运行后的回调函数，本项目主要用于在脚本启动时修改悬浮按钮的样式状态。
	// 在src/system/MyFloaty.ts中回调函数被定义，内容如下：
		// //script.setRunCallback(function () {
		// 		self.runEventFlag = true;
		// 		setTimeout(() => {
		// 			self.runEventFlag = false;
		// 		}, 500);
		// 		runStopItem.setChecked(true);
		// 		ui.run(function () {
		// 			self.fb.getView('logo').setColorFilter(colors.argb(255, 0x08, 0xbc, 0x92)); //设置颜色
		// 		});
		// 	});
		//  然后在_run 方法中，当脚本线程成功启动后会调用这个回调
		// 	if (typeof this.runCallback === 'function') {
		// 		this.runCallback();
		// 	}

	setRunCallback(callback: Function) {
		this.runCallback = callback;   // setRunCallback函数，把参数的函数传入this.runCallback方法，_run 方法启动时运行该方法。
	}

	/**
	 * 设置停止后回调
	 * @param {Function} callback
	 */
	setStopCallback(callback: Function) {
		this.stopCallback = () => {
			callback();
		};
	}

	/**
	 * 根据scheme获取Funclist，Funclist中desc和oper相关坐标根据开发分辨率自动转换成运行分辨率
	 * @param {Scheme} scheme
	 * @returns
	 */
	        //getFuncList返回值：IFunc[]--功能函数--列表中元素格式为
	        // IFunc {
		// 	id?: number;功能ID（可选）
		// 	name?: string;功能名称（可选）
		// 	desc?: string;功能描述（可选）
		// 	config?: IFuncConfigOrigin[];功能配置数组（可选）
				// IFuncConfigOrigin {
				//     desc: string;功能描述
				//     config: Array<{
				//         name: string,
				//         desc: string,
				//         // TODO 修改为枚举类型
				//         type: string, // 'switch' | 'integer' | 'text' | 'scheme' | 'list',
				//         default: boolean | string | number
				//     }>
				// }
	
		// 	operator?: IFuncOperator[]; 自定义操作函数（可选）
				// operator 是 IFuncOperator[] 类型，每个操作项包含：
						// desc?: 多点比色描述，可以是坐标数组或字符串引用
						// oper?: 普通点击坐标数组
						// operStepRandom?: 随机步进点击坐标数组
						// retest?: 重试时间
						// notForCnt?: 是否不计入统计
		// 	operatorFunc?(thisScript: Script, thisOperator: IFuncOperator[]): boolean;
		// 	transed?: boolean;
		// }
		//getFuncList参数值 ：IScheme--脚本方案--对象格式为
		// IScheme {
		//     id: number;
		//     schemeName: string;
		//     groupNames?: string[];
		//     inner?: boolean;
		//     star?: boolean;
		
		//     /**
		//      * 功能id的清单,比如个人探索方案的list是0，1，2，14，15，29
		//      */
		//     list: number[];
		//     config?: {
		//         [key: number]: {
		//             [key: string]: string | boolean | number
		//         }
		//     };
		//     commonConfig?: {
		//         [key: string]: string | boolean | number
		//     };
		//     funcList?: IFunc[];
		// }
	
	getFuncList(scheme: IScheme): IFunc[] {
		// 创建一个空数组，用于存储最终返回的功能列表  
		const retFunclist = [];
		// 检查功能映射表是否已初始化 
		if (!this.funcMap) {
			 // 初始化功能映射表为空对象 
			this.funcMap = {};
			// 遍历全局功能列表，将每个功能以ID为键存入映射表，便于快速查找  
			// 在JavaScript/TypeScript中，Array.prototype.forEach() 是用于遍历数组的方法。
			// 遍历 funcList 数组，将每个元素的 id 作为键，元素本身作为值，存入 this.funcMap 对象
			funcList.forEach(item => this.funcMap[item.id] = item);
		}
		 // 遍历方案中的功能ID列表  
		for (let i = 0; i < scheme.list.length; i++) {  //数组的 ‌length 属性‌ 是一个‌只读数字型属性‌，表示数组当前包含的元素数量。
			// 根据功能ID从映射表中获取对应的功能配置  
			const thisFuncList = this.funcMap[scheme.list[i]]; //this.funcMap是整合了所有的功能函数，然后按当前方案list筛选到thisFuncList
			// 比如个人探索list: [0, 1, 2, 3, 13, 14, 29]，对应funlist文件夹下是
			// 000_结束判断，001_准备，002_退出结算，003.悬赏协作，013_探索_地图进入章节，014_探索_点击挑战图标，029_庭院进入探索地图
			// thisFuncList中就是这6个函数的的某1个
			// 如果功能不存在，跳过当前循环  
			if (!thisFuncList) continue;
			
			// 获取功能的操作配置数组  
			// 比如现在遍历到了“013_探索_地图进入章节”，它的
			// thisFuncList.operator的值是一个包含desc: '',per: [点击坐标]，retest: 等属性内容的数组
			const operator = thisFuncList.operator;  //
			// 检查功能是否未转换过且存在操作配置 
			if (!thisFuncList.transed && operator) {
				// 遍历操作配置数组中的每个操作项 比如“013_探索_地图进入章节”，第0个operator是desc: '探索地图界面',per: [点击坐标]，retest: 1000的1个集合
				for (let k = 0; k < operator.length; k++) {
					// 处理多点比色描述配置  
					if (operator[k].desc) {  //如果desc存在
						 // 如果desc是字符串类型，多点比色
						if (typeof operator[k].desc === 'string') {
							try {
								// 从src\common\multiDetectColors.ts中获取实际的坐标配置并替换字符串引用  
								// 比如multiDetectColors.ts中的key='探索地图界面'时，value是一组6个点的取色数组
								operator[k].desc = this.multiDetectColors[operator[k].desc as string].desc;
							} catch (e) {
								 // 如果引用的配置不存在，输出错误信息并抛出异常  
								console.error(`${operator[k].desc}未在multiDetectColors定义`); //通过从multiDetectColors.ts
								throw e;
							}
						} else {
							// 如果desc是数组类型（直接的坐标配置）  
                    					// 调用helper的GetCmpColorArray方法进行坐标转换（从开发分辨率转为运行分辨率）
							// if (operator[k]?.desc?.length >= 3) {
							operator[k].desc = helperBridge.helper.GetCmpColorArray(operator[k].desc[0], operator[k].desc[1], operator[k].desc[2]);
							// }
						}
					}
					 // 处理普通点击操作坐标  
					if (operator[k].oper) {
						// 调用regionClickTrans方法将开发分辨率坐标转换为运行分辨率坐标  
						operator[k].oper = helperBridge.regionClickTrans(operator[k].oper);
					}
					// 处理随机步进点击操作坐标  
					if (operator[k].operStepRandom) {
						// 遍历随机步进点击数组中的每个坐标配置  
						for (let m = 0; m < operator[k].operStepRandom.length; m++) {
							// 同样进行坐标转换  
							operator[k].operStepRandom[m] = helperBridge.regionClickTrans(operator[k].operStepRandom[m]);
						}
					}
				}
				// 标记该功能已完成坐标转换，避免重复处理  
				thisFuncList.transed = true;
			}
			// 将处理后的功能配置添加到返回列表中  
			retFunclist.push(thisFuncList);
		}
		// 返回处理后的功能列表 
		return retFunclist;
	}

	/**
	 * 将funcList中operator里面的desc和oper转换为适用当前正在分辨率的坐标
	 */
	initFuncList() {
		this.scheme = store.get('currentScheme', null);
		if (null === this.scheme) return;
		this.scheme.funcList = this.getFuncList(this.scheme);
	}

	// getScheduleJobInstance(key) {
	//     if (!this.scheduleMap) {
	//         this.scheduleMap = [];
	//     }
	//     return this.scheduleMap.find(item => item.key === key);
	// };

	// setScheduleJobInstance(key, scheduleJobInstance) {
	//     if (!this.scheduleMap) {
	//         this.scheduleMap = [];
	//     }
	//     this.scheduleMap.push({
	//         key: key,
	//         instance: scheduleJobInstance
	//     });
	// };

	/**
	 * 根据 src\common\multiDetectColors.ts 初始化多点比色数组，相关坐标根据开发分辨率自动转换成运行分辨率
	 */
	initMultiDetectColors() {
		const thisMultiDetectColor = {};
		for (const key in multiDetectColors) {
			const { desc } = multiDetectColors[key];
			thisMultiDetectColor[key] = {
				desc: helperBridge.helper.GetCmpColorArray(desc[0], desc[1], desc[2])
			};
		}
		this.multiDetectColors = thisMultiDetectColor;
	}

	/**
	 * 根据 src\common\multiFindColors.ts 初始化多点找色数组，相关坐标根据开发分辨率自动转换成运行分辨率
	 */
	initMultiFindColors() {
		const thisMultiFindColor = {};
		for (const key in multiFindColors) {
			thisMultiFindColor[key] = {
				region: [0, 0, this.device.width, this.device.height],
				desc: []
			};
			for (const desc of multiFindColors[key].desc) {
				thisMultiFindColor[key].desc.push(this.helperBridge.helper.GetFindColorArray(desc[0], desc[1], desc[2]));
			}
			if (multiFindColors[key].region) {
				const sr = this.helperBridge.getHelper(multiFindColors[key].region[1], multiFindColors[key].region[2]).GetPoint(multiFindColors[key].region[3], multiFindColors[key].region[4], multiFindColors[key].region[0]);
				const er = this.helperBridge.getHelper(multiFindColors[key].region[1], multiFindColors[key].region[2]).GetPoint(multiFindColors[key].region[5], multiFindColors[key].region[6], multiFindColors[key].region[0]);
				thisMultiFindColor[key].region = [sr.x, sr.y, er.x, er.y];
			}
			if (multiFindColors[key].similar) {
				thisMultiFindColor[key].similar = multiFindColors[key].similar;
			}
		}
		this.multiFindColors = thisMultiFindColor;
	}

	/**
	 * 执行多点找色
	 * @param {String} key src\common\multiColors.js的key
	 * @param {Region} inRegion 多点找色区域
	 * @param {Boolean} multiRegion 给true的话表示inRegion为region的数组
	 * @returns
	 */
	findMultiColor(key: string, inRegion?: any, multiRegion?: boolean, noLog?: boolean) {
		this.initRedList();
		if (!multiRegion) {
			const region = inRegion || this.multiFindColors[key].region;
			const desc = this.multiFindColors[key].desc;
			const similar = this.multiFindColors[key].similar || this.scheme.commonConfig.multiColorSimilar
			for (let i = 0; i < desc.length; i++) {
				const item = desc[i];
				const point = this.helperBridge.helper.FindMultiColor(region[0], region[1], region[2], region[3], item, similar, true);
				if (point.x !== -1) {
					if (!noLog) {
						console.log(`[${key}]第${i}个查找成功， 坐标为：(${point.x}, ${point.y})`);
					}
					if (drawFloaty.instacne && item) {
						const toDraw = item.map(kk => {
							return {
								color: 'green',
								region: [point.x + kk[0] - 5, point.y + kk[1] - 5, point.x + kk[0] + 5, point.y + kk[1] + 5]
							}
						});
						toDraw[0].color = 'orange';
						toDraw[0].region = [point.x - 5, point.y - 5, point.x + 5, point.y + 5];
						drawFloaty.draw(toDraw, 200);
					}
					return point;
				}
			}
		} else {
			for (const inRegion2 of inRegion) {
				const region = inRegion2;
				const desc = this.multiFindColors[key].desc;
				const similar = this.multiFindColors[key].similar || this.scheme.commonConfig.multiColorSimilar
				for (let i = 0; i < desc.length; i++) {
					const item = desc[i];
					const point = this.helperBridge.helper.FindMultiColor(region[0], region[1], region[2], region[3], item, similar, true);
					if (point.x !== -1) {
						if (!noLog) {
							console.log(`[${key}]第${i}个查找成功， 坐标为：(${point.x}, ${point.y})`);
						}
						if (drawFloaty.instacne && item) {
							const toDraw = item.map(kk => {
								return {
									color: 'green',
									region: [point.x + kk[0] - 5, point.y + kk[1] - 5, point.x + kk[0] + 5, point.y + kk[1] + 5]
								}
							});
							toDraw[0].color = 'orange';
							toDraw[0].region = [point.x - 5, point.y - 5, point.x + 5, point.y + 5];
							drawFloaty.draw(toDraw, 200);
						}
						return point;
					}
				}
			}
		}
		return null;
	}

	/**
	* 执行多点找色(返回所有点坐标)
	* @param {String} key src\common\multiColors.js的key
	* @param {Region} inRegion 多点找色区域
	* @returns
	*/
	findMultiColorEx(key, inRegion?): Point[] {
		this.initRedList();
		const region = inRegion || this.multiFindColors[key].region;
		const desc = this.multiFindColors[key].desc;
		const similar = this.multiFindColors[key].similar || this.scheme.commonConfig.multiColorSimilar;
		const ret = [];
		for (let i = 0; i < desc.length; i++) {
			const item = desc[i];
			const pointAll = this.helperBridge.helper.FindMultiColorEx(region[0], region[1], region[2], region[3], item, similar, true);
			for (let j = 0; j < pointAll.size(); j++) {
				const point = pointAll.get(j);
				ret.push(point);
				if (drawFloaty.instacne) {
					const toDraw = item.map(kk => {
						return {
							color: 'green',
							region: [point.x + kk[0] - 5, point.y + kk[1] - 5, point.x + kk[0] + 5, point.y + kk[1] + 5]
						}
					});
					toDraw[0].color = 'orange';
					toDraw[0].region = [point.x - 5, point.y - 5, point.x + 5, point.y + 5];
					drawFloaty.draw(toDraw, 400);
				}
			}
			if (pointAll.size() > 0) {
				console.log(`[${key}]第${i}个EX查找成功：${pointAll}`);
			}
		}

		// 过滤位置接近的结果
		const ret2 = [];
		for (let i = 0; i < ret.length; i++) {
			let flag = true;
			const p1 = ret[i];
			for (let j = i + 1; j < ret.length; j++) {
				const p2 = ret[j];
				// 两个点的距离小于30px表示相同点，过滤
				if (Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 30) {
					flag = false;
					break;
				}
			}
			if (flag) {
				ret2.push(p1);
			}
		}
		return ret2;
	}



	/**
	 * 执行多点找色，直到成功为止，返回多点找色坐标
	 * @param {String} key src\common\multiColors.js的key
	 * @param {Integer} timeout 超时时间(ms)
	 * @param {inRegion} inRegion 多点找色区域
	 * @returns
	 */
	findMultiColorLoop(key, timeout, inRegion) {
		let times = Math.round(timeout / +this.scheme.commonConfig.loopDelay);
		while (times--) {
			this.keepScreen(true);
			const point = this.findMultiColor(key, inRegion, false);
			if (point) {
				return point;
			}
			sleep(+this.scheme.commonConfig.loopDelay);
		}
		return null;
	}

	/**
	 * 多点比色，直到成功为止
	 * @param {Desc} desc
	 * @param {Integer} timeout
	 * @param {Integer} sign
	 * @returns
	 */
	compareColorLoop(desc, timeout: number, sign?: number) {
		/**
		 * 条件循环多点比色
		 *
		 * @param description: 色组描述
		 * @param sim:         相似度
		 * @param offset:      偏移查找
		 * @param timeout:     超时时间
		 * @param timelag:     间隔时间
		 * @param sign:        跳出条件,0为比色成功时返回,1为比色失败时返回
		 */
		return this.helperBridge.helper.CompareColorExLoop(desc, this.scheme.commonConfig.colorSimilar, true, timeout, this.scheme.commonConfig.loopDelay, sign || 0);
	}

	/**
	 * 运行脚本
	 * @returns
	 */
	run() {
		this.setCurrentScheme();
		return this._run();
	}

	runWithJob(job: Job): void {
		return this._run(job);
	}

	/**
	 * 运行脚本，内部接口-------------执行入口----------------------
	 * @returns
	 */
	_run(job?: Job): void {
		if (this.runThread) return;
		this.job = job;
		const self = this;
		try {
			this.initFuncList();
			this.initMultiFindColors();
			this.runDate = new Date();
			this.currentDate = new Date();
			this.runTimes = {};
			this.global = merge({}, globalRoot);
			if (null === this.scheme) {
				if (typeof self.stopCallback === 'function') {
					self.stopCallback();
				}
				if (this.job) {
					this.job.doDone();
				}
				return;
			}
		} catch (e) {
			console.error(e);
			if (typeof self.stopCallback === 'function') {
				self.stopCallback();
			}
			if (this.job) {
				this.job.doDone();
			}
			return;
		}
		// test start
		// let img = images.captureScreen();
		// img.saveTo('/sdcard/testimg.png');
		// img.recycle();
		// test end
		myToast(`运行方案[${this.scheme.schemeName}]`);
		this.schemeHistory.push(this.scheme);
		// console.log(`运行方案[${this.scheme.schemeName}]`);
		this.runThread = threads.start(function () {
			try {
				// eslint-disable-next-line no-constant-condition
				// 无限循环监测：while (true) 循环确保持续运行
				// 截屏更新：每次循环都调用 self.keepScreen(false) 获取最新屏幕状态
				// 遍历功能列表：对当前方案的每个功能进行检测
				// 界面识别：通过 self.oper() 方法执行具体的界面识别和操作
						//oper 方法会检查其 operator 数组中的每个元素：
						// 关键的界面识别逻辑在这里：
						// 如果 item.desc 是字符串，则从预定义的 multiDetectColors 配置中获取比色规则
						// 如果 item.desc 是数组，则直接使用该数组作为比色规则
						// 比如013_探索_地图进入章节的第一个operator的desc是'探索地图界面'会从src\common\multiDetectColors.ts中到这个比色规则
						// oper 方法返回真，则执行
				// 循环延时：sleep(+self.scheme.commonConfig.loopDelay) 控制检测频率
				while (true) {
					self.keepScreen(false);
					for (let i = 0; i < self.scheme.funcList.length; i++) {
						// 直到无法匹配任何功能界面，否则一直循环进行界面判断并执行点击。
						// 通过if语句执行oper,函数为self.scheme.funcList[i]
						// 而funcList = this.getFuncList(this.scheme)
						// 比如个人探索list: [0, 1, 2, 3, 13, 14, 29]，比如说循环到了funcList[13]
						if (self.oper(self.scheme.funcList[i], undefined)) { 
							self.currentDate = new Date();
							break;
						}
					}
					sleep(+self.scheme.commonConfig.loopDelay);
				}
			} catch (e) {
				self.runThread = null;
				if (e.toString().indexOf('com.stardust.autojs.runtime.exception.ScriptInterruptedException') === -1) {
					console.error($debug.getStackTrace(e));
				}
				if (typeof self.stopCallback === 'function') {
					self.stopCallback();
				}
				if (this.job) {
					this.job.doDone();
				}
			}
		});
		if (typeof this.runCallback === 'function') {
			this.runCallback();
		}
	}

	/**
	 * 根据当前界面判断自动运行的脚本
	 * 若只有一个方案存在功能比色成功的话直接运行这个方案
	 * 若有多个方案，可运行的方案通过悬浮列表进行选择
	 * 若没有则提示无法识别当前界面
	 * @param {MyFloaty} myfloaty
	 */
			// 完整的监测流程
			// 用户点击自动运行按钮 → autoRun 执行一次性界面识别
			// 识别成功后 → 调用 run() → 启动 _run() 的无限循环
			
			// 这里调用的 self.run() 最终会执行 _run() 方法，启动持续的界面监测循环。
			// 这个方法创建了一个无限循环的线程：
			
			// 无限循环监测：while (true) 循环确保持续运行
			// 截屏更新：每次循环都调用 self.keepScreen(false) 获取最新屏幕状态
			// 遍历功能列表：对当前方案的每个功能进行检测
			// 界面识别：通过 self.oper() 方法执行具体的界面识别和操作
			// 循环延时：sleep(+self.scheme.commonConfig.loopDelay) 控制检测频率
			// 循环中持续截屏、识别界面、执行操作、等待延时

	autoRun(myfloaty: MyFloaty) {
		const self = this;
		self.keepScreen(false);
		threads.start(function () {
			const staredSchemeList = store.get('schemeList', defaultSchemeList).filter(item => {
				return item.star // && item.id != 99;
			});
			const canRunSchemeList = [];
			const funcDescCess = {};
			for (let j = 0; j < staredSchemeList.length; j++) {
				const tarFuncList = self.getFuncList(staredSchemeList[j]);
				let flag = false;
				for (let i = 0; i < tarFuncList.length; i++) {
					if (typeof funcDescCess[tarFuncList[i].id] !== 'undefined') {
						flag = funcDescCess[tarFuncList[i].id];
						if (flag) {
							break;
						}
					} else {
						const cmcfg = Object.assign({}, commonConfigVal, staredSchemeList[j]?.commonConfig || {});
						flag = self.desc(tarFuncList[i], cmcfg);
						funcDescCess[tarFuncList[i].id] = flag;
						if (flag) {
							break;
						}
					}
				}
				if (flag) {
					canRunSchemeList.push(staredSchemeList[j]);
				}
			}
			if (canRunSchemeList.length === 0) {
				myToast('无法识别当前界面');
			} else if (canRunSchemeList.length === 1) {
				self.setCurrentScheme(canRunSchemeList[0].schemeName);
				setTimeout(() => {
					self.run();
				}, 500);
			} else {
				schemeDialog.show(myfloaty, canRunSchemeList);
			}
		});
	}

	/**
	 * 停止脚本
	 */
	stop() {
		events.broadcast.emit('SCRIPT_STOP', '');
	}

	/**
	 * 停止脚本，内部接口
	 */
	_stop(flag?: boolean) {
		if (null !== this.runThread) {
			if (typeof this.stopCallback === 'function') {
				this.stopCallback();
			}
			if (!flag) {
				this.schemeHistory = [];
			}
			if (!flag && this.job) {
				this.job.doDone();
			}
			this.runThread.interrupt();
		}
		this.runThread = null;
	}

	/**
	 * 重新运行，一般在运行过程中通过setCurrenScheme切换方案后调用，停止再运行
	 */
	rerun(schemeName?: unknown, params?: Record<string, unknown>) {
		if ('__停止脚本__' === schemeName) {
			this.doPush(this, {
				text: `[${this.schemeHistory.map(item => item.schemeName).join('、')}]已停止，请查看。`,
				before() { myToast('脚本即将停止，正在上传数据'); }
			});
			this.stop();
			sleep(3000);
			return;
		} else if ('__返回上个方案__' === schemeName) {
			if (this.schemeHistory.length) {
				if (this.schemeHistory.length > 1) {
					const lastSchemeName = this.schemeHistory[this.schemeHistory.length - 2].schemeName
					this.setCurrentScheme(lastSchemeName as string, params);
					this.myToast(`返回上个方案为[${schemeName}]`);
				} else {
					this.doPush(this, {
						text: `[${this.schemeHistory.map(item => item.schemeName).join('、')}]已停止，请查看。`
					});
					myToast('无法查询到上个方案, 可能是此方案为第一个方案');
					this.stop();
					sleep(3000);
					return;
				}
			}
		} else if (schemeName) {
			this.setCurrentScheme(schemeName as string, params);
			this.myToast(`切换方案为[${schemeName}]`);
		}
		events.broadcast.emit('SCRIPT_RERUN', '');
	}

	rerunWithJob(job: Job): void {
		this._stop();
		setTimeout(() => {
			this._run(job);
		}, 510);
	}

	/**
	 * 关键函数，操作函数
	 * 针对func进行多点比色，成功的话按顺序点击oper数组
	 * 若operatorFunc为函数，operator则不执行，调用operatorFunc函数
	 * @param {*} currFunc
	 * @param {*} retest 重试时间
	 */
	//完整的界面判断流程：
	// 1.配置加载：系统启动时从 multiDetectColors 加载所有界面的识别规则
	// 2.坐标转换：根据当前设备分辨率自动转换坐标点
	// 3.循环检测：在 _run 的无限循环中持续调用 oper 方法
	// 4.多点比色：对每个功能项的 desc 规则进行颜色匹配
	// 5.操作执行：识别成功后执行相应的点击或滑动操作

	//  这里的IFunc类型就是配置格式的对象
	oper(currFunc: IFunc, retest?: number) {
		  // 获取当前功能的操作配置数组，包含界面识别和点击操作的配置  
		const operator = currFunc.operator; // 需要计算的坐标通过operater传进去使用
		    // 获取自定义操作函数（如果存在）  
		const operatorFunc = currFunc.operatorFunc;

		// 如果存在自定义操作函数，优先执行自定义函数  
		if (typeof operatorFunc === 'function') {
			// 调用自定义函数，传入脚本实例和操作配置 
			// 执行funclist中的自定义函数operatorFunc，参数为operator
			// 本身operatorFunc在funclist中参数定义类型就是
			// 定义operatorFunc(thisScript: Script, thisOperator: IFuncOperator[]): boolean {
			// IFuncOperator参数类型就是各种配置的数组
			// 一般operatorFunc会调用oper，这样使得oper()就变成了递归函数
			if (operatorFunc.call(null, this, operator)) {  
				console.log('oper_success: [function] currFunc.name' + currFunc.name);
				return true;   // 自定义函数执行成功，返回true  
			}
		// ---------这里开始是核心配置转动作的代码----------------------
		// 没有自定义函数时，遍历操作配置数组  比如013_探索_地图进入章节.ts 有1个operator，有4个对象，前2个有desc后2个没有。遍历数是4
		} else {
			// 遍历operator，一般一个func只有一个operator
			for (let id = 0; id < operator.length; id++) {
				const item = operator[id];  // 当前操作项  
				let rs;  // 界面识别结果  

				// 1.如果 operator[0]的desc属性值存在且不为空
				// 检查是否有界面识别配置  
				if (item.desc && item.desc.length) {

					 // 如果desc是字符串，从预定义配置中获取比色规则 ，进行比色返回结果
					if (typeof item.desc === 'string') {
						// rs 是 helperBridge.helper.CompareColorEx() 方法的返回值，这是一个布尔值（boolean）
						rs = helperBridge.helper.CompareColorEx(this.multiDetectColors[item.desc].desc, this.scheme.commonConfig.colorSimilar, false);
					} else {
						// 如果不是字符串时，直接执行比色 
						rs = helperBridge.helper.CompareColorEx(item.desc, this.scheme.commonConfig.colorSimilar, false);
					}
				// 2.	
				} else {
					  // 没有界面识别配置时，直接返回true（无条件执行） 
					rs = true;
				}
				 // 如果界面识别成功  
				if (rs) {
					// 调试功能：在屏幕上绘制识别点位（绿色方框） 
					if (drawFloaty.instacne && item.desc) {
						let thisDesc: any = item.desc;
						  // 如果是字符串引用，获取实际的比色配置  
						if (typeof item.desc === 'string') {
							thisDesc = this.multiDetectColors[item.desc as string].desc;
						}
						// 创建绘制数据，在每个识别点周围画5像素的绿色方框  
					        //... 将这个数组的所有元素展开
						// [...] 创建一个新数组，包含展开的所有元素
						// 实际效果
						// 假设 thisDesc 包含多个坐标点，展开运算符确保：
						// 不是创建嵌套数组 [[obj1, obj2, obj3]]
						// 而是创建平铺数组 [obj1, obj2, obj3]
						const toDraw = [...thisDesc.map(kk => {  //展开运算符，... ，用于将 thisDesc.map() 返回的数组展开到 toDraw 数组中：				
							return {
								color: 'green',
								region: [kk[0] - 5, kk[1] - 5, kk[0] + 5, kk[1] + 5]
							}
						})];
						// 绘制200毫秒  
						drawFloaty.draw(toDraw, 200);
					}
					 // 处理重试逻辑  
					retest = retest || item.retest || undefined;
					if (retest && retest !== -1) {
						sleep(retest);// 等待指定时间  
						this.keepScreen(false);// 重新截屏  
						return this.oper(currFunc, -1);// 递归调用，-1表示已经重试过 
					}

					 // 统计功能执行次数（防重复计数逻辑）  
					if (!!currFunc.id /* && this.lastFunc !== (currFunc.id + '_' + id) */ && !item.notForCnt) {
						// 增加判断，7.5秒内执行的功能一样的话不计次
						if ((this.lastFunc === currFunc.id && new Date().getTime() - (this.lastFuncDateTime || new Date()).getTime() > 7500) || this.lastFunc !== currFunc.id) {
							// 初始化计数器  
							if (!this.runTimes[currFunc.id]) {
								this.runTimes[currFunc.id] = 0;
							}
							this.runTimes[currFunc.id]++; // 增加执行次数  
							this.lastFunc = currFunc.id; // 记录最后执行的功能ID  
						}
						this.lastFuncDateTime = new Date(); // 更新最后执行时间
					}

					// 执行具体操作  
					if (item.operStepRandom) {
						 // 执行随机步骤点击（多步骤随机点击） 
						if (currFunc.id)
							console.log(`oper_success：[item.operStepRandom] currFunc.name:${currFunc.name} currFunc.id:${currFunc.id} lastFunc:${this.lastFunc} id:${id} oper:${item.oper}`);
						helperBridge.regionStepRandomClick(item.operStepRandom, Math.floor(this.scheme.commonConfig.afterClickDelayBase as number), Math.floor(this.scheme.commonConfig.afterClickDelayRandom as number));
					} else if (item.oper) {
						// 执行普通点击操作  
						if (currFunc.id)
							console.log(`oper_success：[item.oper] currFunc.name:${currFunc.name} currFunc.id:${currFunc.id} lastFunc:${this.lastFunc} id:${id} oper:${item.oper}`);
						helperBridge.regionClick(item.oper, Math.floor(this.scheme.commonConfig.afterClickDelayBase as number || 0), Math.floor(this.scheme.commonConfig.afterClickDelayRandom as number));
					} else {
						// 只识别不操作的情况  
						if (currFunc.id)
							console.log(`oper_success: [] currFunc.name:${currFunc.name} currFunc.id:${currFunc.id} lastFunc:${this.lastFunc} id:${id} oper:${item.oper}`);
					}
					return true;// 操作成功，返回true 
				}
			}
		}
	}

	/**
	 * 根据func中的desc进行多点比色
	 * @param {*} currFunc
	 */
	desc(currFunc: IFunc, commonConfig) {
		const operator = currFunc.operator || []; // 需要计算的坐标通过operater传进去使用
		for (let id = 0; id < operator.length; id++) {
			const item = operator[id];
			if (item.desc) {
				let res = null;
				if (typeof item.desc === 'string') {
					res = helperBridge.helper.CompareColorEx(this.multiDetectColors[item.desc].desc, commonConfig.colorSimilar, false);
					if (res) {
						console.log(`desc_sucess：[string] currFunc.name:${currFunc.name} currFunc.id:${currFunc.id} id:${id}`);
					}
				} else if (item.desc.length > 3) {
					res = helperBridge.helper.CompareColorEx(item.desc, commonConfig.colorSimilar, false);
					if (res) {
						console.log(`desc_sucess：[array] currFunc.name:${currFunc.name} currFunc.id:${currFunc.id} id:${id}`);
					}
					if (item.desc[0][0] === -1) {
						res = true;
					}
				}
				if (res) return true;
			}
		}
		return false;
	}

	setCurrentScheme(schemeName?: string, params?: Record<string, unknown>) {
		if (params) {
			this.runtimeParams = params;
		} else {
			this.runtimeParams = null;
		}
		if (!schemeName) {
			const { schemeName: sName } = store.get('currentScheme', {});
			if (!sName) return;
			schemeName = sName;
		}
		return setCurrentScheme(schemeName, store);
	}

	search(list: Record<string, any>[], prop: string, str: string) {
		return search(list, prop, str)
	}

	questionSearch(str: string) {
		return questionSearch(str);
	}

	launchRelatedApp() {
		const storeSettings = storeCommon.get('settings', {});
		if (storeSettings.defaultLaunchAppList && storeSettings.defaultLaunchAppList.length) {
			const packageName = storeSettings.defaultLaunchAppList[0]
			console.log(`正在启动应用${packageName}`);
			app.launchPackage(packageName);
		} else {
			myToast('未配置关联应用，不启动');
		}
	}

	stopRelatedApp() {
		const storeSettings = storeCommon.get('settings', {});
		if (storeSettings.defaultLaunchAppList && storeSettings.defaultLaunchAppList.length) {
			let am = null;
			if (storeSettings.kill_related_app_mode === 'android api') {
				// // 先跳到自己的界面
				// const i = new android.content.Intent(activity, activity.class);
				// i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
				// i.addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
				// context.startActivity(i);
				// 跳到桌面
				context.startActivity(app.intent({
					action: android.content.Intent.ACTION_MAIN,
					category: android.content.Intent.CATEGORY_HOME,
					flags: ['ACTIVITY_NEW_TASK']
				}));
				sleep(2000);
				// 目标进程就变成后台了，就可以通过杀后台进程实现杀应用
				am = context.getSystemService(context.ACTIVITY_SERVICE);
			}

			const ret = [];
			storeSettings.defaultLaunchAppList.forEach(packageName => {
				if (am) {
					am.killBackgroundProcesses(packageName);
				} else {
					$shell(`am force-stop ${packageName}`, true);
				}
				myToast(`杀应用${packageName}`);
				ret.push(packageName);
				sleep(100);
			});
			sleep(500);
			return ret;
		} else {
			myToast('未配置关联应用，不结束');
			return [];
		}
	}

	regionClick(oper, baseSleep?: number, randomSleep?: number) {
		baseSleep = baseSleep || Math.floor(this.scheme.commonConfig.afterClickDelayBase as number || 0);
		randomSleep = randomSleep || Math.floor(this.scheme.commonConfig.afterClickDelayRandom as number || 0)
		this.helperBridge.regionClick(oper, baseSleep, randomSleep);
	}

	regionSwipe(operSrc, operDest, duration, baseSleep?, randomSleep?) {
		baseSleep = baseSleep || this.scheme.commonConfig.afterClickDelayBase || 0;
		randomSleep = randomSleep || this.scheme.commonConfig.afterClickDelayRandom || 0
		this.helperBridge.regionSwipe(operSrc, operDest, duration, baseSleep, randomSleep);
	}

	regionBezierSwipe(operSrc, operDest, duration, baseSleep?, randomSleep?, type?) {
		baseSleep = baseSleep || this.scheme.commonConfig.afterClickDelayBase || 0;
		randomSleep = randomSleep || this.scheme.commonConfig.afterClickDelayRandom || 0
		this.helperBridge.regionBezierSwipe(operSrc, operDest, duration, baseSleep, randomSleep, type)
	}
}

const script = new Script();

events.broadcast.on('SCRIPT_STOP', () => {
	script._stop();
});

events.broadcast.on('SCRIPT_RUN', () => {
	script._run();
});

events.broadcast.on('SCRIPT_RERUN', () => {
	script._stop(true);
	setTimeout(() => {
		script._run(script.job);
	}, 510);
});

export default script;
