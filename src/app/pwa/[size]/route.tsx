import { appIcon } from "@/lib/app-icon";

export const dynamicParams = false;

export const generateStaticParams = () => [{ size: "192" }, { size: "512" }];

export const GET = async (
  _request: Request,
  { params }: RouteContext<"/pwa/[size]">
) => {
  const { size } = await params;
  return await appIcon(Number(size));
};
