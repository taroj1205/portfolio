import { appIcon } from "@/lib/app-icon";

export const size = { height: 180, width: 180 };
export const contentType = "image/png";

const Icon = async () => await appIcon(size.width);

export default Icon;
