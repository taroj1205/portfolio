import { defineDocumentType, defineNestedType, makeSource } from 'contentlayer/source-files'
import readingTime from 'reading-time';

const Author = defineNestedType(() => ({
    name: 'Author',
    fields: {
        name: { type: 'string', required: true },
        image: { type: 'string', required: true },
    },
}));

const Post = defineDocumentType(() => ({
    name: 'Post',
    filePathPattern: `**/*.mdx`,
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
            required: true,
        },
        category: {
            type: 'string',
            description: 'The category of the post',
            required: false,
        },
        author: {
            type: 'nested',
            of: Author,
        }
    },
    computedFields: {
        url: {
            type: 'string',
            resolve: (doc) => `/posts/${doc.slug}`,
        },
        readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) }
    }
}))

export default makeSource({
    contentDirPath: 'posts',
    documentTypes: [Post],
})