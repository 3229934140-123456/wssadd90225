export default defineAppConfig({
  pages: [
    'pages/tasks/index',
    'pages/clockin/index',
    'pages/tips/index',
    'pages/mine/index',
    'pages/countdown/index',
    'pages/review/index',
    'pages/growth/index',
    'pages/mentor/index',
    'pages/nurse/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5F3FF',
    navigationBarTitleText: '敷麻助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '今日任务'
      },
      {
        pagePath: 'pages/clockin/index',
        text: '开麻打卡'
      },
      {
        pagePath: 'pages/tips/index',
        text: '知识提示'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
