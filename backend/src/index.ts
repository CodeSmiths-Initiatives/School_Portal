import { seedDefaultData } from "./bootstrap/seed";

export default {
  register() {},

  async bootstrap({ strapi }) {
    await seedDefaultData(strapi);
  },
};
