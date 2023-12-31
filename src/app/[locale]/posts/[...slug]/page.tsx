import "../../code.css";
import { allPosts } from "contentlayer/generated";
import { getMDXComponent } from "next-contentlayer/hooks";
import { compareDesc } from "date-fns";
import Image from "next/image";
import DateFormatter from "@/components/DateFormatter";
import { IoChatbubbleOutline } from "react-icons/io5";
import Link from "next/link";
import TableContents from "@/components/TableContents";
import markdownStyles from "./markdown-styles.module.css";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { ownerConfigs, ownerMetaData } from "@/utils/ownerConfigs";
import WordCounter from "@/components/WordCounter";
import { notFound } from "next/navigation";
import metadata from "@/app/metadata.json";
import { headers } from "next/headers";
import Education from "@/components/Education";
import NCEA from "@/components/NCEA/Ncea";
import SchoolHistory from "@/components/SchoolHistory";
import { Kbd, KbdKey } from "@nextui-org/react";
import Socials from "@/components/Socials";
import { FiLink2 } from "react-icons/fi";
import Hamburger from "./components/Hamburger";
import Dropdown from "./components/Dropdown";

export const dynamic = "force-dynamic";

const usedComponents = {
	Education,
	NCEA,
	SchoolHistory,
	TableContents,
	WordCounter,
	FiLink2,
	Hamburger,
	Dropdown,
	Kbd(props: { keys: KbdKey[]; text: string }) {
		return <Kbd keys={props.keys}>{props.text}</Kbd>;
	},
};

export const generateStaticParams = async () => {
	return allPosts.map((post) => {
		const slug = post.path.split("/").filter(Boolean);
		return { params: { slug: slug } };
	});
};

export const generateMetadata = ({
	params,
}: {
	params: { slug: string; locale: string };
}) => {
	const locale = params.locale;
	const headerList = headers();
	const slug = headerList.get("x-slug") as string;
	const path = slug.split("/").slice(2).join("/") as string;
	const post = allPosts.find(
		(post) => post.locale === locale && post.path.trim() === path && !post.draft
	) as any;

	if (!post || post.url === "/posts/about") {
		console.log("post not found");
		notFound();
	}
	let pageMetadata = (metadata as Record<string, any>)["blog-post"];

	// Replace placeholders with actual values
	let title = post.title;
	let description = post.description;
	let imageUrl = post.image;

	return {
		metadataBase: new URL(pageMetadata.metadataBase),
		title: pageMetadata.title[locale].replace("{title}", title),
		description: pageMetadata.description[locale].replace(
			"{description}",
			description
		),
		icons: pageMetadata.icons,
		openGraph: {
			images: pageMetadata.openGraph.images.map(
				(image: { url: string; alt: { [key: string]: string } }) => ({
					url: image.url.replace("{image}", imageUrl),
					alt: image.alt[locale],
				})
			),
		},
		twitter: {
			card: pageMetadata.twitter.card,
			title: pageMetadata.twitter.title[locale].replace("{title}", title),
			description: pageMetadata.twitter.description[locale].replace(
				"{description}",
				description
			),
			site: pageMetadata.twitter.site,
			creator: pageMetadata.twitter.creator,
			images: pageMetadata.twitter.images.map(
				(image: { url: string; alt: { [key: string]: string } }) => ({
					url: image.url.replace("{image}", imageUrl),
					alt: image.alt[locale],
				})
			),
		},
		viewport: pageMetadata.viewport,
	};
};

const PostLayout = ({
	params,
}: {
	params: { slug: string; locale: string };
}) => {
	const headerList = headers();
	const slug = headerList.get("x-slug") as string;
	const path = slug.split("/").slice(2).join("/") as string;
	console.log("postURL", path);
	const post = allPosts.find(
		(post) =>
			post.locale === params.locale && post.path.trim() === path && !post.draft
	) as any;

	if (!post) {
		console.log("post not found");
		notFound();
	}
	const sortedPosts = [...allPosts]
		.filter((post) => post.locale === params.locale && !post.draft)
		.sort((a, b) =>
			compareDesc(new Date(a.publishedAt), new Date(b.publishedAt))
		);

	const currentIndex = sortedPosts.findIndex(
		(p) => p.path.trim() === post.path.trim()
	);
	const prevPostIndex = currentIndex > 0 ? currentIndex - 1 : null;
	let nextPostIndex =
		currentIndex < sortedPosts.length - 1 ? currentIndex + 1 : null;

	// Skip the next post if its URL is "/posts/about"
	if (
		nextPostIndex !== null &&
		sortedPosts[nextPostIndex].url.trim() === "/posts/about"
	) {
		nextPostIndex++;
	}

	const prevPost = prevPostIndex !== null ? sortedPosts[prevPostIndex] : null;
	const nextPost =
		nextPostIndex !== null && nextPostIndex < sortedPosts.length
			? sortedPosts[nextPostIndex]
			: null;

	const Content = getMDXComponent(post.body.code);

	const categories = post.category?.split(",") || [];
	const readTime = `${Math.round(post.readingTime.minutes)}${
		post.locale === "ja" ? "分で読めます" : " min to read"
	}`;

	return (
		<div className="md:px-2">
			<div className="mx-auto max-w-3xl p-4 md:px-6 md:rounded-lg">
				<p className="block text-center space-x-2 text-base font-semibold uppercase tracking-wide">
					{categories.map((item: any, index: any) => (
						<Link
							className="text-indigo-600 hover:text-indigo-700 hover:underline"
							href={`/posts/categories/${item.trim()}`}
							key={index}>
							#{item.trim()}
						</Link>
					))}
				</p>
				<h1 className="my-2 block text-center text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
					{post.title}
				</h1>
				<div className="flex items-center justify-center">
					<span className="text-gray-600 dark:text-gray-400 mr-3 inline-flex items-center leading-none text-sm pr-3 py-1 border-r-2 border-gray-200 dark:border-gray-600">
						{readTime}
					</span>
					<span className="items-center text-gray-600 dark:text-gray-400 text-sm py-1 inline-flex space-x-1">
						<IoChatbubbleOutline />
						<DateFormatter
							date={String(post.publishedAt)}
							lang={String(post.locale)}
						/>
					</span>
				</div>
				<Image
					className="md:h-[18rem] h-[14rem] mt-3 mb-2 w-full object-cover object-center"
					src={post.image}
					width={720}
					height={400}
					alt="blog"
				/>
				<div className="flex flex-col md:flex-row items-start md:justify-between md:items-center my-4">
					<div className="flex flex-col">
						<div className="flex items-center rounded-lg space-x-4">
							<Image
								src={ownerConfigs.image as string}
								width={50}
								height={50}
								alt="blog"
								className="rounded-full"
							/>

							<div className="text-gray-800 dark:text-gray-200 flex flex-col">
								<strong className="text-lg">
									{(ownerConfigs.name as Record<string, string>)[
										params.locale
									].toString()}
								</strong>
								<span className="text-sm mb-1">
									{(ownerConfigs.job as Record<string, string>)[
										params.locale
									].toString()}
								</span>
								<Socials />
							</div>
						</div>
					</div>
				</div>
				<article
					className={`${markdownStyles["markdown"]} mx-auto space-y-4 leading-snug prose-md prose prose-indigo lg:prose-lg rounded-lg`}>
					<Content components={usedComponents} />
				</article>
				<div className="mt-4">
					{prevPost ? (
						<Link
							href={`/${params.locale}${prevPost.url}`}
							className="flex float-left items-center flex-row py-2 px-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded">
							<BsArrowLeft className="sm:mr-1" />
							<span className="hidden sm:block">
								{params.locale === "ja" ? "前の投稿" : "Previous Post"}
							</span>
						</Link>
					) : nextPost ? (
						<Link
							href={`/${params.locale}${nextPost.url}`}
							className="flex float-right items-center flex-row py-2 px-4 bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded">
							<span className="hidden sm:block">
								{params.locale === "ja" ? "次の投稿" : "Next Post"}
							</span>
							<BsArrowRight className="sm:ml-1" />
						</Link>
					) : (
						<Link
							href={"/posts"}
							className="flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
							<BsArrowLeft className="mr-2" />
							{post.locale === "ja" ? "投稿一覧へ" : "Back to posts"}
						</Link>
					)}
				</div>
			</div>
		</div>
	);
};

export default PostLayout;
