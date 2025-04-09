import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_API

export async function test_connect_host({ host_ip, username, password }) {
  try {
    const response = await axios.post(`${BASE_URL}/api/xapi/test_connection`, {
      host_ip,
      username,
      password,
    })

    return {
      success: true,
      message: response.data.message,
      code: response.status,
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.error || 'Unknown error',
        details: error.response.data.details || '',
        code: error.response.status,
      }
    } else {
      return {
        success: false,
        message: 'Network error',
        details: error.message,
        code: 0,
      }
    }
  }
}
