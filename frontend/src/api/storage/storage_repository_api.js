import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_API

export async function fetch_host_sr(host_ip) {
    try {
        console.log('Using backend API:', BASE_URL)
        const response = await axios.get(`${BASE_URL}/api/storage/list?host_ip=${host_ip}`)
        console.log('Fetched hosts:', response)
        return response.data["storage_repositories"]
    } catch (error) {
        console.error('Failed to fetch hosts:', error)
        return []
    }
}