import axios from 'axios'
const BASE_URL = import.meta.env.VITE_BACKEND_API


export async function get_all_restores(restore_id) {
    // try {
    //     const response = await axios.get(`${BASE_URL}/api/job/list/backup/${backup_id}`)
    //     return {
    //         success: true,
    //         data: response.data
    //     }
    // } catch (error) {
    //     console.error('Failed to add new host connection:', error)
    //     return {
    //         success: false,
    //         error: error.response?.data || error.message
    //     }
    // }
}