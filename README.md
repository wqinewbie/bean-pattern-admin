# Bean Pattern Admin

拼豆魔法屋管理后台前端，基于 Vue 3 + Vite 开发。

## 功能模块

- 数据看板（实时数据统计）
- 用户管理（查看、禁用/启用用户）
- 图纸管理（审核、上下线）
- Banner 管理（轮播图配置）
- 拼豆品牌管理
- 色盘管理
- 色号管理
- 反馈管理
- 订单管理
- VIP 套餐管理
- 提现申请处理
- 管理员管理

## 技术栈

- Vue 3
- Vite
- JavaScript ES6+
- CSS 3

## 快速开始

### 环境要求

- Node.js 14+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

输出到 `dist/` 目录

## 配置

### API 地址

修改 `src/utils/request.js` 中的 API 基础地址

### 登录凭证

默认管理员账号：admin / admin123

## 项目结构

```
src/
├── layouts/         # 布局组件
├── views/           # 页面组件
├── router/          # 路由配置
├── stores/          # 状态管理
├── utils/           # 工具函数
├── App.vue
├── main.js
└── style.css
```

## 许可证

MIT
