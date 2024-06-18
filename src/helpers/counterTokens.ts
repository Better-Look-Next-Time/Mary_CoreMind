export function counterTokens(message: string): number {
	let counter: number = 0
	const wordArray = message.split(' ')
	wordArray.forEach((word: string) => {
		if (word.length <= 4 || /[0-9\\.,:]/.test(word)) {
			counter += 1
		} else {
			counter += 3
		}
	})
	return counter
}
