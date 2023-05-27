import z from 'zod'

import { authDefaults, authSchema } from '../common/auth'

export type RequestSpecEntry = z.infer<typeof schema>

export enum BodyType {
  Text = 'text',
  Form = 'form',
  File = 'file',
  GraphQL = 'graphql',
  None = 'none',
}

export enum TextMimeType {
  PlainText = 'text/plain',
  Html = 'text/html',
  Json = 'application/json',
  Xml = 'application/xml',
  Yaml = 'text/yaml',
}

export enum BodyFormFieldType {
  Text = 'text',
  File = 'file',
  FileText = 'filetext',
}

export const schema = z.object({
  id: z.string(),
  clientUpdatedAt: z.number(),
  collectionId: z.string().or(z.null()),
  workspaceId: z.string(),
  orderKey: z.string(),
  name: z.string().max(20),
  method: z.string(),
  url: z.string(),
  body: z.object({
    type: z.enum([
      BodyType.Text,
      BodyType.Form,
      BodyType.File,
      BodyType.GraphQL,
      BodyType.None,
    ]),
    text: z.object({
      format: z.enum([
        TextMimeType.PlainText,
        TextMimeType.Html,
        TextMimeType.Json,
        TextMimeType.Xml,
        TextMimeType.Yaml,
      ]),
      value: z.string(),
    }),
    form: z.object({
      isMultipart: z.boolean(),
      fields: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          value: z.string(),
          enabled: z.boolean(),
          type: z.enum([
            BodyFormFieldType.Text,
            BodyFormFieldType.File,
            BodyFormFieldType.FileText,
          ]),
        })
      ),
    }),
    graphql: z.object({
      query: z.string(),
      variables: z.string(),
    }),
  }),
  params: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.string(),
      enabled: z.boolean(),
    })
  ),
  headers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.string(),
      enabled: z.boolean(),
    })
  ),
  auth: authSchema,
  settings: z.object({
    graphqlSchemaFetch: z.boolean(),
  }),
})

export const defaults: Partial<RequestSpecEntry> = {
  collectionId: null,
  name: '',
  orderKey: 'a0',
  method: 'GET',
  url: '',
  body: {
    type: BodyType.None,
    text: {
      format: TextMimeType.PlainText,
      value: '',
    },
    form: {
      isMultipart: false,
      fields: [],
    },
    graphql: {
      query: '',
      variables: '',
    },
  },
  params: [],
  headers: [],
  auth: authDefaults,
  settings: {
    graphqlSchemaFetch: true,
  },
}
