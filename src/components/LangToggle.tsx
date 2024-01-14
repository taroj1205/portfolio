import { usePathname } from "@/lib/next-intl";
import Image from "next/image";
import Link from "next/link";

export const LangToggle = () => {
	const pathname = usePathname();
	return (
		<div className="relative inline-block text-left">
				<Link
					href={"/en" + pathname}
					className={`toENG flex items-center justify-center w-fit p-1 mr-1 md:mr-0 rounded-full active:scale-95 duration-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}>
					<Image
						src="/svg/flag/jp.svg"
						alt="Theme"
						width={24}
						height={24}
						className="w-6 h-6"
					/>
				</Link>
				<Link
					href={"/ja" + pathname}
					className={`toJPN flex items-center justify-center w-fit p-1 mr-1 md:mr-0 rounded-full active:scale-95 duration-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}>
					<Image
						src="/svg/flag/nz.svg"
						alt="Theme"
						width={24}
						height={24}
						className="w-6 h-6"
					/>
				</Link>
		</div>
	);
};
