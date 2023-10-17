import { defineDocumentType, makeSource } from 'contentlayer/source-files'

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
        date: {
            type: 'date',
            description: 'The date of the post',
            required: true,
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
        }
    },
    computedFields: {
        url: {
            type: 'string',
            resolve: (doc) => `/posts/${doc.slug}`,
        },
    }
}))

export default makeSource({
    contentDirPath: 'posts',
    documentTypes: [Post],
})