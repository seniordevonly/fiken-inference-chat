interface Config {
  models: {
    [key: string]: {
      INFERENCE_URL: string;
      API_KEY: string;
    };
  };
}

export const config: Config = {
  models: {
    "claude-3-5-sonnet-latest": {
      INFERENCE_URL: process.env.INFERENCE_3_5_URL || 'https://localhost:3000/v1/chat',
      API_KEY: process.env.INFERENCE_3_5_KEY || 'inf-1234567890',
    },
    "claude-3-7-sonnet": {
      INFERENCE_URL: process.env.INFERENCE_3_7_URL || 'https://localhost:3000/v1/chat',
      API_KEY: process.env.INFERENCE_3_7_KEY || 'inf-1234567890',
    },
  },
};

export const getModels = () => {
  return Object.keys(config.models);
};

export const getModel = (model: string) => {
  return config.models[model];
};
