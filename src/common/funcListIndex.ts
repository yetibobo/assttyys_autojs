// 这段代码实现了一个动态模块加载器，用于自动扫描和加载 funcList 目录下的所有功能配置文件，并将它们统一导出为一个功能列表数组。

// 核心实现流程
// 1. 动态模块扫描
// 使用 webpack 的 require.context API 扫描 funcList 目录下所有 .js 和 .ts 文件：

// './funcList': 扫描目录
// false: 不递归子目录
// /\.[jt]s$/: 匹配 .js 和 .ts 文件
// 2. 模块加载策略
// 代码支持两种模块导出方式：

// 默认导出方式：如果模块有 default 导出，直接使用
// 类实例化方式：如果没有默认导出，查找匹配 Func\d+ 模式的类名并实例化

// 3. 排序和导出
// 最后按功能ID排序并导出完整的功能列表

// 在项目中的使用
// 这个功能列表在脚本系统中被广泛使用。在 Script 类的 getFuncList 方法中，它被用来构建功能映射表



import { IFunc } from '@/interface/IFunc';

// 自动加载funcList目录下所有配置统一导出
const fl = require.context('./funcList', false, /\.[jt]s$/);

const funcList: IFunc[] = [];

fl.keys().forEach(key => {
	const keys = Object.keys(fl(key));
	if (keys.includes('default')) {
		funcList.push(fl(key).default);
	} else {
		// 如果没有导出默认模块，则手工查找类然后实例化
		for (let i = 0; i < keys.length; i++) {
			if (keys[i].match(/Func\d+/)) {
				const cn = fl(key)[keys[i]];
				funcList.push(new cn);
				break;
			}
		}
	}
});
funcList.sort((a, b) => a.id - b.id);

export default funcList;
