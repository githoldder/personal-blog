module.exports = {
  apps: [
    {
      name: "personal-blog-dev",
      script: "npm",
      args: "run dev -- --host 127.0.0.1 --port 4321",
      watch: false,
      time: true
    },
    {
      name: "personal-blog-preview",
      script: "npm",
      args: "run preview -- --host 127.0.0.1 --port 4322",
      watch: false,
      time: true
    }
  ]
};
