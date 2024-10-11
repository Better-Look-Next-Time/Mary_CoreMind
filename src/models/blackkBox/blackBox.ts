import axios from 'axios'

const header = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Accept': '*/*',
  'Referer': 'https://www.blackbox.ai/agent/ImageGenerationLV45LJp',
  'Content-Type': 'application/json',
  'Origin': 'https://www.blackbox.ai',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Priority': 'u=0',
}

export async function blackBoxImageGen(prompt: string) {
  const data = {
    messages: [{ id: '2-wcO9sfmS3bPgrKXB4Kd', content: prompt, role: 'user' }],
    previewToken: null,
    userId: null,
    codeModelMode: true,
    agentMode: {
      mode: true,
      id: 'ImageGenerationLV45LJp',
      name: 'Image Generation',
    },
    trendingAgentMode: {},
    isMicMode: false,
    maxTokens: 1024,
    playgroundTopP: null,
    playgroundTemperature: null,
    isChromeExt: false,
    githubToken: null,
    clickedAnswer2: false,
    clickedAnswer3: false,
    clickedForceWebSearch: false,
    visitFromDelta: false,
    mobileClient: false,
    userSelectedModel: null,
  }
  const response = await axios.post('https://www.blackbox.ai/api/chat', data, {
    headers: header,
  })
  const result = response.data as string
  const image_url = result.replace('![Generated Image](', '').replace(')', '')
  return image_url
}
