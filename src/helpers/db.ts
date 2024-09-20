import type OpenAI from 'openai'
import type { AvailabilityAIResult, ContentResult, CounterResult, DataAvailabilityResult, TokenResult, UserCharacterResult, UserMessageType } from '../interface/DatabaseInterface'
import type { HistoryUser } from '../interface/HistoryUserInterface'
import type { ModelNameType, ModelRoleType } from './../models/openai/types'

import { Database } from 'bun:sqlite'

const db = new Database('./mary.sqlite')

const historyError: OpenAI.Chat.ChatCompletionMessageParam[] = [{ content: 'Произошла ошибка', role: 'assistant' }]

export function createTables() {
  const tables = db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all()
  if (!tables.some((table: any) => table.name === 'chat_messages' || table.name === 'users_message' || table.name === 'ai_availability')) {
    db.query(
      `CREATE TABLE "chat_messages" ( "id" INTEGER PRIMARY KEY AUTOINCREMENT,  "chat_id" TEXT, "content" TEXT, "role" TEXT, "model" TEXT, "type" TEXT, "tokens" INTEGER, "counter" INTEGER  )`,
    ).run()
    db.query(
      `CREATE TABLE "users_message" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "chat_id" TEXT, "user_id" TEXT, "type" TEXT,  "content" TEXT, "counter" INTEGER )`,
    ).run()
    db.query(
      `CREATE TABLE "ai_availability" ( "id" INTEGER PRIMARY KEY AUTOINCREMENT, "model" TEXT, "is_active" INTEGER, "next_available_date" TEXT)`,
    ).run()
  }
}

export function insertChatMessages(chat_id: string, content: string, role: ModelRoleType, model: ModelNameType, tokens: number, counter: number) {
  try {
    db.query(`INSERT INTO "chat_messages" (chat_id, content, role, model, type, tokens, counter) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`).run(chat_id, content, role, model, 'message', tokens, counter)
  }
  catch (error) {
    console.log(error)
  }
}

export function insertChatMemory(chat_id: string, content: string, counter: number) {
  try {
    db.query(`INSERT INTO "chat_messages" (chat_id, content, type, counter) VALUES (?1, ?2, 'memory', ?3)`).run(chat_id, content, counter)
  }
  catch (error) {
    console.log(error)
  }
}

export function insertUsersMessage(chat_id: string, user_id: string, type: UserMessageType, content: string, counter: number) {
  try {
    db.query(`INSERT INTO "users_message" ( chat_id, user_id, type, content, counter ) VALUES (?1, ?2, ?3, ?4, ?5) `).run(chat_id, user_id, type, content, counter)
  }
  catch (error) {
    console.log(error)
  }
}

export function insertAIAvailability(model: ModelNameType, status: boolean, data: Date) {
  try {
    db.query(`INSERT INTO "ai_availability" (model, is_active, next_available_date) VALUES (?1, ?2, ?3)`).run(model, status, data.toString())
  }
  catch (error) {
    console.log(error)
  }
}

export function getHistoryChat(chat_id: string, model: ModelNameType, counter: number): OpenAI.Chat.ChatCompletionMessageParam[] {
  try {
    const history = db.query(`SELECT content, role FROM "chat_messages" WHERE chat_id = ?1 AND model = ?2 AND type = 'message'  ORDER BY id DESC LIMIT ?3`).all(chat_id, model, counter * 3) as OpenAI.Chat.ChatCompletionMessageParam[]
    return history.reverse()
  }
  catch (error) {
    console.log(error)
    return historyError
  }
}

export function getMemoryChat(chat_id: string) {
  try {
    const memory = db.query(`SELECT content FROM  "chat_messages" WHERE chat_id = ?1 AND type = 'memory' ORDER BY id DESC LIMIT 1`).get(chat_id) as ContentResult
    return memory?.content ?? ''
  }
  catch (error) {
    console.log(error)
    return ''
  }
}

export function getHistoryUser(chat_id: string, user_id: string, counter: number): HistoryUser[] {
  try {
    return db.query(`SELECT content FROM "users_message" WHERE chat_id = ?1 AND user_id = ?2 AND type = 'message' ORDER BY id DESC LIMIT ?3`).all(chat_id, user_id, counter) as HistoryUser[]
  }
  catch (error) {
    console.log(error)
    return [{ content: 'Error' }]
  }
}

export function getCounterChat(chat_id: string, model: ModelNameType) {
  try {
    const counter = db.query(`SELECT counter FROM "chat_messages" WHERE chat_id = ?1 AND model = ?2 ORDER BY id DESC `).get(chat_id, model) as CounterResult
    return counter?.counter ?? 1
  }
  catch (error) {
    console.log(error)
    return 1
  }
}

export function getCounterUser(chat_id: string, user_id: string) {
  try {
    const counter = db.query(`SELECT counter FROM "users_message" WHERE chat_id = ?1 AND user_id = ?2  ORDER BY id DESC `).get(chat_id, user_id) as CounterResult
    return counter?.counter ?? 0
  }
  catch (error) {
    console.log(error)
    return 0
  }
}

export function getTokens(chat_id: string, model: ModelNameType) {
  try {
    const tokens = db.query(`SELECT tokens FROM 'chat_messages' WHERE chat_id = ?1 AND model = ?2 ORDER BY id DESC`).get(chat_id, model) as TokenResult
    return tokens?.tokens ?? 0
  }
  catch (error) {
    console.log(error)
    return 0
  }
}

export function getUserCharacter(chat_id: string, user_id: string) {
  try {
    const userCharacter = db.query(`SELECT content FROM users_message WHERE chat_id = ?1 AND user_id = ?2 ORDER BY id DESC LIMIT 1`).get(chat_id, user_id) as UserCharacterResult
    return userCharacter?.userCharacter ?? ''
  }
  catch (error) {
    console.log(error)
    return ''
  }
}

export function getStatusAI(model: ModelNameType) {
  try {
    const aiStatus = db.query(`SELECT is_active FROM ai_availability WHERE model = ?1 ORDER BY id DESC LIMIT 1 `).get(model) as AvailabilityAIResult
    console.log(aiStatus)
    return aiStatus?.is_active ?? true
  }
  catch (error) {
    console.log(error)
    return false
  }
}

export function getDataAIAvailability(model: ModelNameType) {
  try {
    const data = db.query(`SELECT next_available_date FROM ai_availability WHERE model =?1 ORDER BY id DESC LIMIT 1`).get(model) as DataAvailabilityResult
    console.log(data)
    return data?.next_available_date ? new Date(data.next_available_date) : new Date()
  }
  catch (error) {
    console.log(error)
    return new Date()
  }
}
