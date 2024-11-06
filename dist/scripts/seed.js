"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const neon_tenant_1 = require("@/lib/neon-tenant");
const pg_1 = require("pg");
function createProject() {
    return neon_tenant_1.neonApiClient
        .POST("/projects", {
        body: {
            project: {},
        },
    })
        .then(({ data, error }) => {
        console.log(data, error);
        return data === null || data === void 0 ? void 0 : data.project.id;
    });
}
const globalClient = new pg_1.Client({
    connectionString: process.env.POSTGRES_URL,
});
console.log("Initializing database...");
globalClient
    .query(fs_1.default.readFileSync("./db/schema.sql", "utf8"))
    .then(() => {
    console.log("Initializing workspaces...");
    return Promise.all([createProject(), createProject()]);
})
    .then((projects) => {
    const tenantPromises = projects.map((projectId) => (0, neon_tenant_1.getTenantConnectionString)(projectId).then((uri) => {
        const tenantClient = new pg_1.Client({ connectionString: uri });
        return tenantClient.query(fs_1.default.readFileSync("./db/tenant-schema.sql", "utf8"));
    }));
    return Promise.all([
        Promise.all(tenantPromises),
        globalClient.query(`INSERT INTO workspaces (name, project_id) VALUES ('Workspace 1', ${projects[0]}), ('Workspace 2', ${projects[1]})`),
    ]);
})
    .catch((error) => {
    console.error(error);
});
