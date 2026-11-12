// src/api/billboard/routes/billboard.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/billboard-news',
      handler: 'billboard.getNews',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};