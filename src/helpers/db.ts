import { Database } from 'bun:sqlite'
import type { ModelNmaeType, ModelRoleType } from '../models/openai/types'

import { character, systemPromot } from '../assets/character'

import { counterTokens } from './counterTokens'

const db = new Database('./mary.sqlite')

export function createTable(tableName: string) {
	const tables = db.query(`SELECT name FROM sqlite_master WHERE type='table';`).all()
	console.log(tables)
	if (tables.some((table: any) => table.name == tableName)) {
		console.log('Я уже есть')
	} else {
		db.query(
			`CREATE TABLE "${tableName}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT ,"content" TEXT, "role" TEXT, "ai" TEXT, "userName" TEXT, "date" TEXT,  "counter" INTEGER, "tokens" INTEGER)`
		).run()
		console.log('Я создал таблицу')
	}
}

export async function insertInDateBase(
	tableName: string,
	message: string,
	role: ModelRoleType,
	model: ModelNmaeType,
	userName: string,
	counter: number, 
  tokens :number
) {
	try {
		db.query(
			`INSERT INTO "${tableName}" (content, role, ai, userName, date, counter, tokens) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
		).run(message, role, model, userName, new Date().toString(), counter, tokens)
	} catch (err) {
		console.log(err)
	}
}

export function getHistory(tableName: string, model: ModelNmaeType, counter: number): any {
	try {
    counter = counter == 1 ? 3 : counter * 2 + 1
    console.log(counter)
		const response = db
			.query(`SELECT content, role FROM "${tableName}" WHERE ai = ?1 ORDER BY id DESC LIMIT ?2`)
			.all(model, counter  )
		return response.reverse()
	} catch (err) {
		console.log(err)
	}
}

export function getCounter(tableName: string, model: ModelNmaeType) {
	const counter = db.query(`SELECT counter FROM "${tableName}" WHERE ai = ?1 ORDER BY id DESC `).get(model)
	console.log(counter)
	if (counter === null) {
		console.log('Я пустой')
		return  1
	}
	return counter.counter
}

export function getTokens(tableName :string, model :ModelNmaeType) {
  const tokens = db.query(`SELECT tokens FROM "${tableName}" WHERE ai = ?1 ORDER BY id DESC`).get(model)
  if( tokens == null) {
    console.log("Tokesn is null")
    return 0
  }
  return tokens.tokens
}

export function addSystem(tableName: string, model: ModelNmaeType) {
	if (db.query(`SELECT * FROM "${tableName}" WHERE ai=?1`).get(model) == null) {
		insertInDateBase(tableName, character, 'system', model, 'ai', 1, counterTokens(character))
	} else {
		console.log('Я уже довно добавил системник')
	}
}
