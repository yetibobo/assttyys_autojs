import schemeList from '@/system/webviewEvents/schemeList';
import funcList from '@/system/webviewEvents/funcList';
import settings from '@/system/webviewEvents/settings';
import about from '@/system/webviewEvents/about';
import schedule from '@/system/webviewEvents/schedule';

export default function webviewEvents() {
	// 读取/src/common/schemeList.ts内容并分组
	schemeList();
	
	funcList();
	settings();
	about();
	schedule();
}
