// 1.该对话框创建一个UI列表视图来显示不同状态的定时任务，包括正在执行、队列中和等待执行的任务 

// 2. 动态数据获取 - 从调度系统获取实时的任务状态数据：
// 获取当前正在运行的任务 
// 获取任务队列中的任务 
// 获取等待执行的任务并按执行时间排序 

// 3. 任务交互功能 - 用户可以点击等待中的任务来立即执行它们 
// 与悬浮控件的集成
// 该对话框通过 showScheduleDialog 函数被悬浮控件调用。在 MyFloaty.ts 中，当用户点击 ScheduleList 按钮时会触发此对话框 
// 时间格式化功能
// 对话框包含两个辅助函数：

// formatDate - 将日期格式化为可读的字符串格式 
// bueatifyTime - 将时间差转换为人性化的描述（如"将于2小时后执行"）

// 与调度系统的集成
// 该对话框与 src/system/Schedule/index.ts 中的调度系统紧密集成，
// 通过调用 schedule.getRunningJub()、schedule.getJobQueue() 和 schedule.getJobList() 等方法获取实时的任务状态数据 

import schedule from '@/system/Schedule/index';

export const showScheduleDialog = function () {
	const view = ui.inflate(`<frame>
        <vertical>
            <list id="list">
                <card w="*" h="50" margin="5 2" cardCornerRadius="2dp"
                    cardElevation="1dp" foreground="?selectableItemBackground">
                    <horizontal gravity="center_vertical">
                        <vertical padding="10 2" h="auto" w="*" layout_weight="1">
                            <text id="title" text="{{this.name}}" textColor="#222222" textSize="16sp" maxLines="1" />
                            <text visibility="{{this.status === 'waiting' ? 'visible' : 'gone'}}" text="{{this.nextDateBueatifyTime}}" textColor="#999999" textSize="14sp" maxLines="1" />
                        </vertical>
                        <text id="statusText" w="80" gravity="center" text="{{this.statusStr}}" textColor="{{this.statusColor}}" />
                    </horizontal>
                </card>
            </list>
        </vertical>
    </frame>`);

	const scheduleDialog = dialogs.build({
		title: '定时任务',
		customView: view
	}).show();

	const topList = []; /* [{
		name: '喂猫喂狗',
		status: 'running',
		statusStr: '执行中',
		statusColor: '#00cc00',
	}, {
		name: '悬赏',
		status: 'queueing',
		statusStr: '队列中',
		statusColor: '#cc0000',
	}, {
		name: '每日签到与领取邮箱奖励',
		status: 'queueing',
		statusStr: '队列中',
		statusColor: '#cc0000',
	}];*/
	const runnJob = schedule.getRunningJub();
	if (runnJob) {
		topList.push({
			name: runnJob.name,
			status: 'running',
			statusStr: '执行中',
			statusColor: '#00cc00',
		});
	}
	const queueList = schedule.getJobQueue();
	if (queueList?.length) {
		for (const job of queueList) {
			topList.push({
				name: job.name,
				status: 'queueing',
				statusStr: '队列中',
				statusColor: '#cc0000',
			});
		}
	}

	const waitList = schedule.getJobList().filter(item => {
		if (!item.checked) return false;
		for (const ii of topList) {
			if (ii.name === item.name) {
				return false;
			}
		}
		return true;
	}).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime()).map(item => {
		return {
			name: item.name,
			nextDateStr: formatDate(item.nextDate),
			nextDateBueatifyTime: bueatifyTime(item.nextDate.getTime() - new Date().getTime()),
			status: 'waiting',
			statusStr: topList.length ? '加入队列' : '立即执行',
			statusColor: '#0000dd', // #4f91de
		}
	});


	view.list.setDataSource([...topList, ...waitList]);
	view.list.on('item_bind', function (itemView, itemHolder) {
		itemView.statusText.on('click', () => {
			const item = itemHolder.item;
			if (item.status !== 'waiting') return;
			scheduleDialog.dismiss();

			const job = schedule.getJobByName(item.name);
			if (job) {
				job.nextDate = new Date();
				schedule.immediateTimerInterval();
			}
		});
	});
}


function formatDate(date: Date) {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	const d = date.getDate();
	const h = date.getHours();
	const i = date.getMinutes();
	const s = date.getSeconds();
	const padZero = num => num < 10 ? `0${num}` : `${num}`;
	return `${[y, m, d].map(padZero).join('-')} ${[h, i, s].map(padZero).join(':')}`;
}

function bueatifyTime(ms: number) {
	const absMs = Math.abs(ms);
	const d = Math.floor(absMs / 1000 / 60 / 60 / 24);
	const h = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const m = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
	const s = Math.floor((absMs % (1000 * 60)) / 1000);
	let str = '';
	if (d) str += `${d}天`;
	if (h) str += `${h}时`;
	if (m) str += `${m}分`;
	if (s) str += `${s}秒`;
	if (ms < -180000) {
		str = '已错过' + str;
	} else if (ms <= 0) {
		str = '即将执行';
	} else {
		str = '将于' + str + '后执行';
	}
	return str;
}
