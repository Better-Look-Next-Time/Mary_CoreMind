import type { ModelNameType } from '../models/openai/types'

export interface Emotion {
  model: ModelNameType
  emotion: string
  request: string
}
