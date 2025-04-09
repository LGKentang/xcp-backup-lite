import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_API

export async function fetch_connected_host() {
  try {
    console.log('Using backend API:', BASE_URL)
    const response = await axios.get(`${BASE_URL}/api/hosts/list`)
    console.log('Fetched hosts:', response)
    return response.data.hosts
  } catch (error) {
    console.error('Failed to fetch hosts:', error)
    return []
  }
}
