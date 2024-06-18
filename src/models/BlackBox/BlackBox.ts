import axios from 'axios'
import { character } from '../../assets/character'

export async function blackbox(message: string) {
	const data = {
		messages: [
			{
				content: character,
				role: 'system',
			},
			{
				content: message,
				role: 'user',
			},
		],
		id: '',
		previewToken: null,
		userId: '',
		codeModelMode: true,
		agentMode: {},
		trendingAgentMode: {},
		isMicMode: false,
	}
	try {
		const response = await axios.post('https://www.blackbox.ai/api/chat', data, {
			headers: {
				Accept: '*/*',
				'Accept-Language': 'en-US,en;q=0.5',
				Referer: 'https://www.blackbox.ai/',
				'Content-Type': 'application/json',
				Origin: 'https://www.blackbox.ai',
				'Alt-Used': 'www.blackbox.ai',
			},
		})
		const answer: string = await response.data
		const answerArr: string[] = answer.split('$~~~$')
		return answerArr[answerArr.length - 1]
	} catch (error) {
		console.log(error)
	}
}
