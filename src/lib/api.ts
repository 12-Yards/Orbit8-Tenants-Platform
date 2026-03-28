import axios from "axios";

const api = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("_tenantId");
    if (tenantId) {
      config.params = config.params || {};
      config.params._tenantId = tenantId;
    }
  }
  return config;
});

export default api;
