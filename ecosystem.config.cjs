module.exports = {
  apps: [
    {
      name: "saitalevit",
      cwd: "/home/user1/apps/saitalevit/current",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "3003",
      },
    },
  ],
};
