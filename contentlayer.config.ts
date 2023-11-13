import { defineDocumentType, defineNestedType, makeSource } from 'contentlayer/source-files'
import readingTime from 'reading-time';
import GithubSlugger from "github-slugger"
import rehypePrismPlus from "rehype-prism-plus"
import remarkGfm from "remark-gfm"
import { v4 as uuidv4 } from 'uuid';
import rehypeSlug from "rehype-slug";

const Author = defineNestedType(() => ({
    name: 'Author',
    fields: {
        name: { type: 'string', required: true },
        image: { type: 'string', required: true },
    },
}));

const Post = defineDocumentType(() => ({
    name: 'Post',
    filePathPattern: `**/**/*.mdx`,
    contentType: 'mdx',
    fields: {
        title: {
            type: 'string',
            description: 'The title of the post',
            required: true,
        },
        description: {
            type: 'string',
            description: 'The description of the post',
            required: true,
        },
        publishedAt: {
            type: 'date',
            description: 'The date of the post',
            required: true,
        },
        updatedAt: {
            type: 'date',
            description: 'The update date of the post',
            required: false,
        },
        image: {
            type: 'string',
            description: 'The image of the post',
            required: true,
        },
        locale: {
            type: 'string',
            description: 'The locale of the post',
            required: true,
        },
        slug: {
            type: 'string',
            description: 'The slug of the post',
            required: false,
        },
        category: {
            type: 'string',
            description: 'The category of the post',
            required: false,
        },
        author: {
            type: 'nested',
            of: Author,
            required: true,
        },
        draft: {
            type: 'boolean',
            default: false,
        }
    },
    computedFields: {
        url: {
            type: 'string',
            resolve: (doc) => {
                const pathSegments = doc._raw.flattenedPath.split('/');
                pathSegments.shift();
                return `/posts/${pathSegments.join('/')}`;
            },
        },
        fileName: {
            type: 'string',
            resolve: (doc) => {
                const fileName = doc._raw.sourceFileName.trim();
                const contentType = doc._raw.contentType.trim();
                return fileName.replace(`.${contentType}`, '');
            }
        },
        path: {
            type: 'string',
            resolve: (doc) => {
                const pathSegments = doc._raw.flattenedPath.split('/');
                pathSegments.shift();
                return pathSegments.join('/');
            },
        },
        readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
        headings: {
            type: "json",
            resolve: async (doc) => {
                const regXHeader = /\n(?<flag>#{1,6})\s+(?<content>.+)/g;
                const slugger = new GithubSlugger()
                const headings = Array.from(doc.body.raw.matchAll(regXHeader)).map(
                    ({ groups }) => {
                        const flag = groups?.flag;
                        const content = groups?.content;
                        return {
                            ['level']: (flag?.length ?? 0) - 1,
                            text: content,
                            slug: content ? slugger.slug(content) : undefined
                        };
                    }
                );
                return headings;
            },
        },
        id: {
            type: 'string',
            resolve: (doc) => uuidv4(),
        }
    }
}))

export default makeSource({
    contentDirPath: 'posts',
    documentTypes: [Post],
    mdx: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true, showLineNumbers: true }], rehypeSlug],
    },
})