import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_API

export async function add_host_connection({ name, host_ip, username, password }) {
    try {
        const response = await axios.post(`${BASE_URL}/api/hosts/add`, {
            name,
            host_ip,
            username,
            password
        })
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('Failed to add new host connection:', error)
        return {
            success: false,
            error: error.response?.data || error.message
        }
    }
}

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

export async function update_host_detail(hostId, updatedFields, handleUpdate) {
    try {
        const response = await axios.patch(`${BASE_URL}/api/hosts/update/${hostId}`, updatedFields)
        await handleUpdate()
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error(`Failed to update host with ID ${hostId}:`, error)
        await handleUpdate()
        return {
            success: false,
            error: error.response?.data || error.message
        }
    }
}

export async function delete_host(hostId) {
    try {
        const response = await axios.delete(`${BASE_URL}/api/hosts/delete/${hostId}`)
        return {
            success: true,
            message: response.data.message
        }
    } catch (error) {
        console.error(`Failed to delete host with ID ${hostId}:`, error)
        return {
            success: false,
            error: error.response?.data || error.message
        }
    }
}