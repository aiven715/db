import z from 'zod'

export type Icon = z.infer<typeof iconSchema>
export type Color = z.infer<typeof colorSchema>

export const colorSchema = z.enum([
  'gray',
  'green',
  'pink',
  'blue',
  'red',
  'orange',
  'purple',
  'aqua',
  'yellow',
])

export const iconSchema = z.object({
  name: z.enum([
    'default',
    'circle',
    'triangle',
    'square',
    'rhombus',
    'hexagon',
    'heart',
    'star',
    'thumbUp',
    'rocket',
    'cloud',
    'bulb',
    'diamond',
    'lock',
    'wrench',
    'hammer',
    'flame',
    'monitor',
    'mobile',
    'globe',
    'database',
    'creditCard',
    'paperPencil',
    'bubble',
  ]),
  color: colorSchema,
})

export const iconDefaults: Icon = {
  name: 'default',
  color: 'gray',
}
