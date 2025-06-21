import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// 约定：微服务地址通过环境变量配置，如 SERVICE_USER_URL, SERVICE_ORDER_URL 等
const serviceMap: Record<string, string> = {
  user: process.env.SERVICE_USER_URL || "",
  order: process.env.SERVICE_ORDER_URL || "",
  // 可继续扩展
};

export const dynamic = 'force-dynamic';

async function handleProxy(request: NextRequest, params: { slug: string[] }) {
  // 1. 认证
  const authResult = await verifyToken(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  // 2. 路由分发
  // 约定：/api/proxy/{service}/{...path}
  if (!params.slug || params.slug.length < 1) {
    return NextResponse.json({ error: "Invalid proxy path" }, { status: 400 });
  }
  const [service, ...pathParts] = params.slug;
  const targetBase = serviceMap[service];
  if (!targetBase) {
    return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }
  const targetPath = pathParts.join("/");
  const url = new URL(request.url);
  const targetUrl = `${targetBase}/${targetPath}${url.search}`;

  // 3. 转发请求
  const fetchOptions: RequestInit = {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
  };
  try {
    const resp = await fetch(targetUrl, fetchOptions);
    const data = await resp.arrayBuffer();
    const headers = new Headers(resp.headers);
    headers.delete("transfer-encoding");
    headers.delete("connection");
    return new NextResponse(data, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  } catch (e) {
    return NextResponse.json({ error: "Proxy error", detail: String(e) }, { status: 502 });
  }
}

// 支持所有 HTTP 方法
export async function GET(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
}
export async function POST(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
}
export async function PUT(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
}
export async function DELETE(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
}
export async function PATCH(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
}
export async function OPTIONS(request: NextRequest, context: any) {
  return handleProxy(request, context.params);
} 