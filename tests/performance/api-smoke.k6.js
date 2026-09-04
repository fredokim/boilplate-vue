import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
  vus: 5,
  duration: "30s",
};

const baseUrl = __ENV.API_BASE_URL ?? "http://127.0.0.1:5173";

export default function () {
  const response = http.get(`${baseUrl}/api/auth/session`);

  check(response, {
    "session endpoint responded": (res) => res.status < 500,
  });

  sleep(1);
}

