import z from 'zod'

export type Auth = z.infer<typeof authSchema>

export type AuthWithInherited = z.infer<typeof authWithInheritedSchema>

export enum AuthType {
  NONE = 'none',
  INHERITED = 'inherited',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'apiKey',
}

export enum AuthTarget {
  HEADERS = 'headers',
  PARAMS = 'params',
}

export const authSchema = z.object({
  type: z.enum([
    AuthType.BASIC,
    AuthType.BEARER,
    AuthType.API_KEY,
    AuthType.NONE,
  ]),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
  }),
  target: z.enum([AuthTarget.HEADERS, AuthTarget.PARAMS]),
})

export const authWithInheritedSchema = authSchema.extend({
  type: z.enum([
    AuthType.INHERITED,
    AuthType.BASIC,
    AuthType.BEARER,
    AuthType.API_KEY,
    AuthType.NONE,
  ]),
})

export const authDefaults: Auth = {
  type: AuthType.NONE,
  credentials: {
    username: '',
    password: '',
  },
  target: AuthTarget.HEADERS,
}
