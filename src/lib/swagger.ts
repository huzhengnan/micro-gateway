import { createSwaggerSpec } from "next-swagger-doc";

// 新增：获取其他微服务 swagger 地址
const SERVICE_SWAGGER_URLS = (process.env.SERVICE_SWAGGER_URLS || "").split(",").map(s => s.trim()).filter(Boolean);

export const getApiDocs = async () => {
  // 本服务文档
  const spec: any = createSwaggerSpec({
    apiFolder: "src/app/api", // 定义API文件夹路径
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Gateway API Documentation",
        version: "1.0.0",
        description: "Aggregated API documentation for all microservices.",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });

  // 聚合其他微服务文档
  const otherSpecs = await Promise.all(
    SERVICE_SWAGGER_URLS.map(async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        return await resp.json();
      } catch {
        return null;
      }
    })
  );

  // 合并 paths 和 components
  for (const other of otherSpecs) {
    if (!other) continue;
    Object.assign(spec.paths, other.paths);
    if (other.components && other.components.schemas) {
      spec.components.schemas = {
        ...spec.components.schemas,
        ...other.components.schemas,
      };
    }
  }

  return spec;
};