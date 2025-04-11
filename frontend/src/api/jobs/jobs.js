import axios from 'axios'
const BASE_URL = import.meta.env.VITE_BACKEND_API


export async function get_backup_jobs_by_id(backup_id) {
    try {
        const response = await axios.get(`${BASE_URL}/api/job/list/backup/${backup_id}`)
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


export async function runBackupJob({
    host_ip,
    vm_uuid,
    sr_uuid,
    backup_id
}) {
    try {
        const response = await axios.post(`${BASE_URL}/api/xapi/backup_vm`, {
            host_ip,
            vm_uuid,
            sr_uuid,
            backup_id
        })

        const { job_id, job_status, output, backup_path } = response.data

        return {
            success: true,
            job_id,
            status: job_status,
            output,
            backup_path
        }
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || 'Backup failed',
            output: error.response?.data?.output || '',
            job_id: error.response?.data?.job_id || null
        }
    }
}
