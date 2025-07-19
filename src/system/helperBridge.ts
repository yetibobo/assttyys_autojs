import { getWidthPixels, getHeightPixels } from '@auto.pro/core';
import drawFloaty from '@/system/drawFloaty';
import { getNormalRandom, getRegionBiasRnd2, hash, strHashToNum } from '@/common/toolAuto';
import { IMyAutomator } from '@/system/MyAutomator';

// 核心功能概述：设备操作桥接层，负责抽象化设备交互和坐标转换
// helperBridge.ts 模块实现了以下主要功能：

// 1. 坐标系统转换
// src/system/helperBridge.ts:57-98
// 该模块的核心功能之一是将开发分辨率（1280x720）的坐标转换为运行时设备的实际坐标。这确保了脚本在不同分辨率的设备上都能正确执行。

// 2. 点击操作实现
// src/system/helperBridge.ts:107-136
// regionClick() 方法是项目中所有点击动作的核心实现，它接收坐标数组并执行实际的点击操作。该方法还集成了智能坐标计算，通过 getRegionBiasRnd2() 生成更人性化的点击位置。

// 3. 滑动和手势操作
// src/system/helperBridge.ts:164-176
// 模块提供了多种滑动操作方法，包括普通滑动 regionSwipe()、贝塞尔曲线滑动 regionBezierSwipe() 和复杂手势 regionGesture()。

// 4. ScriptLib 集成
// src/system/helperBridge.ts:42-54
// 该模块集成了 ScriptLib 的 AnchorGraphicHelper，这是一个高性能的图色识别库，用于多点比色和多点找色操作。

// 在项目架构中的作用
// 与脚本引擎的集成
// src/system/script.ts:107

// Script 类在构造函数中引用了 helperBridge 实例，使得所有的设备操作都通过这个统一的桥接层进行。
// 实际调用链路
// 当脚本执行时，调用流程如下：

// script.oper() 检测到界面匹配 src/system/script.ts:789-792
// 调用 helperBridge.regionClick() 执行点击
// 坐标通过 regionClickTrans() 转换
// 最终通过 automator.press() 执行实际点击
// 权限初始化
// src/common/toolAuto.ts:67-68
// 在获取截图权限成功后，系统会调用 helperBridge.init() 初始化 ScriptLib，然后初始化多点比色数据。

// 设计优势
// 这种桥接层设计的优势在于：

// 抽象化设备操作：统一了不同类型的设备交互
// 坐标自动转换：解决了多分辨率兼容问题
// 操作智能化：通过随机偏移使自动化行为更接近人类操作
// 高性能图色识别：集成 ScriptLib 提供高效的视觉识别能力

// const normal = -1; //定义常量
// const left = 0;
// const center = 1;
// const right = 2;
// const needRoot = device.sdkInt < 24;

const devWidth = 1280;
const devHeight = 720;
let screenWidth = getWidthPixels();
let screenHeight = getHeightPixels();
// const scale = screenHeight / devHeight;
if (screenWidth < screenHeight) {
	const t = screenWidth;
	screenWidth = screenHeight;
	screenHeight = t;
}

export interface IhelperBridge {
	automator: IMyAutomator | null,
	helper: any | null,
	helperPoly: object,
	getHelper(dw: number, dh: number),
	init: () => void,
	regionClickTrans: (oper) => any,
	setAutomator: (automator: IMyAutomator) => void,
	regionClick: (transedOper: [number, number, number, number, number][], baseSleep: number, randomSleep: number) => void,
	regionStepRandomClick: (transedOperStepRandom, baseSleep: number, randomSleep: number) => void,
	regionSwipe: (transedOperS, transedOperE, duration, baseSleep, randomSleep) => void,
	swipePath: (paths) => void,
	regionBezierSwipe: (transedOperS, transedOperE, duration, baseSleep, randomSleep, type?) => void,
}

export class helperBridge implements IhelperBridge {
	automator = null;
	helper = null;
	helperPoly = {};
	getHelper(dw: number, dh: number) {
		if (!this.helperPoly[dw + '_' + dh]) {
			this.helperPoly[dw + '_' + dh] = com.scriptlib.AnchorGraphicHelper.Create(runtime, dw, dh, 0, 0, screenWidth - 1, screenHeight - 1);
			console.log(`初始化helper:[${dw}, ${dh}]:${this.helperPoly[dw + '_' + dh]}`);
		}
		return this.helperPoly[dw + '_' + dh];
	}
	init() {
		console.log('init', com.scriptlib.AnchorGraphicHelper);
		console.log(`ScriptLib Version: ${com.scriptlib.AnchorGraphicHelper.Version()}`);
		console.log('ScriptLib initializing');
		this.helper = this.getHelper(devWidth, devHeight);
		console.log('ScriptLib initialize success');
	}
	// [[right, 1280, 720, 1119, 504, 1227, 592, 2000]]
	regionClickTrans(oper) {
		for (let i = 0; i < oper.length; i++) {
			// let regionWidth = null;
			// let regionHeight = null;
			// let regionX = null;
			// let regionY = null;

			// if (oper[i][0] == center) {
			//     regionWidth = (oper[i][3] - oper[i][1]) * scale;
			//     regionHeight = (oper[i][4] - oper[i][2]) * scale;
			//     regionX = screenWidth / 2 + (oper[i][1] - (devWidth / 2)) * scale
			//     regionY = screenHeight / 2 + (oper[i][2] - (devHeight / 2)) * scale
			// } else if (oper[i][0] === left) {
			//     regionWidth = (oper[i][3] - oper[i][1]) * scale;
			//     regionHeight = (oper[i][4] - oper[i][2]) * scale;
			//     regionX = oper[i][1] * scale;
			//     regionY = oper[i][2] * scale;
			// } else if (oper[i][0] === right) {
			//     regionWidth = (oper[i][3] - oper[i][1]) * scale;
			//     regionHeight = (oper[i][4] - oper[i][2]) * scale;
			//     regionX = screenWidth - ((devWidth - oper[i][1]) * scale);
			//     regionY = oper[i][2] * scale;
			// } else if (oper[i][0] === normal) {
			//     // TODO
			// }
			// oper[i] = [
			//     regionX,
			//     regionY,
			//     regionX + regionWidth,
			//     regionY + regionHeight,
			//     oper[i][5]
			// ];
			if (oper[i][3] === -1) {
				oper[i] = [-1, -1, -1, -1, ...oper[i].slice(7)]
			} else {
				const sr = this.getHelper(oper[i][1], oper[i][2]).GetPoint(oper[i][3], oper[i][4], oper[i][0]);
				const er = this.getHelper(oper[i][1], oper[i][2]).GetPoint(oper[i][5], oper[i][6], oper[i][0]);
				oper[i] = [sr.x, sr.y, er.x, er.y, ...oper[i].slice(7)]
			}
		}
		return oper;
	}

	setAutomator(automator: IMyAutomator) {
		this.automator = automator;
	}

	// [[1119, 504, 1227, 592, 2000]]
	// [[x1, y1, x2, y2, afterSleep, pressTimeout?]]
	// 按顺序点击
	regionClick(transedOper: [number, number, number, number, number, number?][], baseSleep: number, randomSleep: number) {
		const self = this;
		transedOper.forEach(item => {
			if (item[0] >= 0) {
				// let x = random(item[0], item[2]);
				// let y = random(item[1], item[3]);
				const [x, y] = getRegionBiasRnd2(item, [strHashToNum(device.getAndroidId(), item[0], item[2]), strHashToNum(device.getAndroidId(), item[1], item[3])], 1);
				const pressTimeout = item[5] ? random(item[5], item[5] + 50) : random(10, 60);
				console.log(`执行点击操作 === x坐标:${Math.trunc(x)}, y坐标:${Math.trunc(y)}, oper为[${transedOper[0][0]}, ${transedOper[0][1]}, ${transedOper[0][2]}, ${transedOper[0][3]}, ${transedOper[0][4]}]`);
				if (drawFloaty.instacne) {
					const toDraw = [{
						color: 'orange',
						region: [item[0], item[1], item[2], item[3]]
					}, {
						color: 'red',
						region: [x - 5, y - 5, x + 5, y + 5]
					}];
					drawFloaty.draw(toDraw, 300);
					// sleep(500);
				}
				self.automator.press(x, y, pressTimeout);
			} else {
				console.log(`传入坐标信息为(${JSON.stringify(item)}), 不执行操作`);
			}

			// sleep(item[4] + random(baseSleep || 0, randomSleep || 0));
			const sleepRegion: [number, number] = [item[4] + (baseSleep || 0), item[4] + (baseSleep || 0) + (randomSleep || 0)];
			sleep(getNormalRandom(sleepRegion, strHashToNum(device.getAndroidId(), sleepRegion[0], sleepRegion[1])))
		});
	}

	// [[
	//     [69, 171, 170, 452, 1000, 2], // 最后一个参数，表示执行这个的概率，[0, 2)命中
	//     [1104,72, 1200,687, 1000, 5], // [2, 5)命中
	// ]]
	regionStepRandomClick(transedOperStepRandom, baseSleep: number, randomSleep: number): void {
		// 生成一套，然后给regionClick操作
		const oper = [];
		transedOperStepRandom.forEach(item => {
			// let sum = 0;
			// for (let i = 0; i < item.length; i++) {
			//     sum += item[i][5];
			// }
			// let rn = random(0, sum - 1);
			// let curSum = 0;
			// for (let i = 0; i < item.length; i++) {
			//     // 命中
			//     if (rn >= curSum && rn < curSum + item[i][5]) {
			//         oper.push(item[i]);
			//         break;
			//     }
			//     curSum += item[i][5];
			// }
			oper.push(item[hash(0, item.length - 1, device.getAndroidId())]);
		});
		this.regionClick(oper, baseSleep, randomSleep);
	}
	regionSwipe(transedOperS, transedOperE, duration, baseSleep, randomSleep) {
		const time = random(duration[0], duration[1])
		this.automator.swipe(
			random(transedOperS[0], transedOperS[2]), // x1
			random(transedOperS[1], transedOperS[3]), // y1
			random(transedOperE[0], transedOperE[2]), // x2
			random(transedOperE[1], transedOperE[3]), // y2
			time // duration
		);
		// sleep(baseSleep + random(0, randomSleep))
		const sleepRegion: [number, number] = [baseSleep, baseSleep + randomSleep];
		sleep(getNormalRandom(sleepRegion, strHashToNum(device.getAndroidId(), sleepRegion[0], sleepRegion[1])))
		console.log(`执行滑动操作 === ${transedOperS}`);
	}
	/**
	 * @paths [{ x: 123, y: 234 }, { delay: 200, x: 111, y: 333}, { delay: 200, x: 111, y: 222 }]
	 */
	swipePath(paths) {
		// TODO root下需要补点，否则拖不过去
		// if (needRoot) {
		// 使用rootautomator用画path
		// ra获取报错的话就不管手势了，直接用Swipe代替
		let time = 0;
		paths.forEach(item => {
			time += item.delay || 0;
		});
		this.automator.swipe(
			paths[0].x, // x1
			paths[0].y, // y1
			paths[paths.length - 1].x, // x2
			paths[paths.length - 1].y, // y2
			time // duration
		);
		sleep(time + 10);
		// } else {
		//     // 使用无障碍gesture画path
		//     let points = [[paths[0].x, paths[0].y]];
		//     let duration = 0;
		//     for (let i = 1; i < paths.length; i++) {
		//         duration += paths[i].delay;
		//         points.push([paths[i].x, paths[i].y]);
		//     }
		//     gesture(duration, ...points);
		//     sleep(duration);
		// }
	}
	// [1119, 504, 1227, 592, 2000]
	// type0-竖直方向，1-水平方向 TODO
	regionBezierSwipe(transedOperS, transedOperE, duration, baseSleep, randomSleep, type?) {
		return this.automator.regionBezierSwipe(transedOperS, transedOperE, duration, baseSleep, randomSleep, type);
	}

	// 使用oper[]按顺序滑动
	regionGesture(transedOper: [number, number, number, number, number?, number?][], duration: number, randomSleep: number): void {
		const points = transedOper.map(item => {
			return getRegionBiasRnd2(item, [strHashToNum(device.getAndroidId(), item[0], item[2]), strHashToNum(device.getAndroidId(), item[1], item[3])], 1);
		});

		console.log(`执行滑动操作 === ${points}`);
		if (drawFloaty.instacne) {
			const toDraw = [...points.map(point => ({
				color: 'red',
				region: [point[0] - 5, point[1] - 5, point[0] + 5, point[1] + 5]
			})), ...transedOper.map(item => ({
				color: 'orange',
				region: [item[0], item[1], item[2], item[3]]
			}))];
			drawFloaty.draw(toDraw, Math.max(duration - 20, 300));
			sleep(200);
		}
		this.automator.gesture(duration, ...points);
		// sleep(random(0, randomSleep || 0));
		const sleepRegion: [number, number] = [0, randomSleep || 0];
		sleep(getNormalRandom(sleepRegion, strHashToNum(device.getAndroidId(), sleepRegion[0], sleepRegion[1])));
	}
}

const helperBridgeService = new helperBridge();

export default helperBridgeService;
