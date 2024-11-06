"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neonApiClient = void 0;
exports.getTenantConnectionString = getTenantConnectionString;
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
exports.neonApiClient = (0, openapi_fetch_1.default)({
    baseUrl: "https://console.neon.tech/api/v2/",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEON_API_KEY}`,
    },
});
async function getTenantConnectionString(projectId) {
    const { data } = await exports.neonApiClient.GET("/projects/{project_id}/connection_uri", {
        params: {
            path: {
                project_id: projectId,
            },
            query: {
                role_name: "neondb_owner",
                database_name: "neondb",
            },
        },
    });
    return data === null || data === void 0 ? void 0 : data.uri;
}
