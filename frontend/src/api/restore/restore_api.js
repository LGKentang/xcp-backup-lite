import axios from 'axios'
const BASE_URL = import.meta.env.VITE_BACKEND_API


export async function get_all_restores() {
    try {
        const response = await axios.get(`${BASE_URL}/api/restore/list`)
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('Failed to fetch restores:', error)
        return {
            success: false,
            error: error.response?.data || error.message
        }
    }
}


export async function get_restore_by_id(restore_id) {
    try {
        const response = await axios.get(`${BASE_URL}/api/restore/list/${restore_id}`)
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('Failed to fetch restores:', error)
        return {
            success: false,
            error: error.response?.data || error.message
        }
    }
}


export async function add_restore({
    host_ip,
    sr_uuid,
    backup_id,
    preserve,
    power_on_after_restore,
  }) {
    try {
      console.log('Using backend API:', BASE_URL);
  
      const payload = {
        host_ip,
        sr_uuid,
        preserve,
        power_on_after_restore,
        backup_id
      };
      const response = await axios.post(`${BASE_URL}/api/restore/add`, payload);
      console.log('Restore added successfully:', response.data);
  
      return response.data;
    } catch (error) {
      console.error('Failed to add restore:', error);
      return []; 
    }
  }