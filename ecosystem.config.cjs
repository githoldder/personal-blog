module.exports = {
  apps: [
    {
      // 1. 动态开发环境 (Dev Mode): 支持实时热重载
      name: "personal-blog-dev",
      script: "npm",
      args: "run dev -- --host 127.0.0.1 --port 4321",
      watch: false,
      time: true
    },
    {
      // 2. 静态预览环境 (Static Preview): 仅对外服务 dist/ 下编译好的生产静态文件
      // 源码修改后，必须运行 npm run build / npm run verify 更新 dist 才能在该环境看到变化
      name: "personal-blog-preview",
      script: "npm",
      args: "run preview -- --host 127.0.0.1 --port 4322",
      watch: false,
      time: true
    }
  ]
};
