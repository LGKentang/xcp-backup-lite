import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_API;


export async function fetch_backups() {
    try {
        console.log('Using backend API:', BASE_URL)
        const response = await axios.get(`${BASE_URL}/api/backup/list`)
        console.log('Fetched hosts:', response)
        return response.data
    } catch (error) {
        console.error('Failed to fetch hosts:', error)
        return []
    }
}

export async function fetch_backups_by_host(host_ip) {
  try {
      console.log('Using backend API:', BASE_URL)
      const response = await axios.get(`${BASE_URL}/api/backup/list?host_ip=${host_ip}`)
      console.log('Fetched hosts:', response)
      return response.data
  } catch (error) {
      console.error('Failed to fetch hosts:', error)
      return []
  }
}

export async function fetch_backup_versions_by_backup_id(backup_id){
  try {
    console.log('Using backend API:', BASE_URL)
    const response = await axios.get(`${BASE_URL}/api/backup/list/active/${backup_id}`)
    console.log('Fetched hosts:', response)
    return response.data
} catch (error) {
    console.error('Failed to fetch hosts:', error)
    return []
}
}


export async function fetch_backup_by_id(backup_id) {
  try {
      console.log('Using backend API:', BASE_URL)
      const response = await axios.get(`${BASE_URL}/api/backup/list/${backup_id}`)
      console.log('Fetched hosts:', response)
      return response.data
  } catch (error) {
      console.error('Failed to fetch hosts:', error)
      return []
  }
}

export async function add_backup({
  name,
  description,
  sr_uuid,
  sr_name,
  vm_uuid,
  vm_name,
  host_ip,
  active,
  retention,
  cron_schedule,
}) {
  try {
    console.log('Using backend API:', BASE_URL);

    const payload = {
      name,
      description,
      sr_uuid,
      sr_name,
      vm_uuid,
      vm_name,
      host_ip,
      active,
      retention,
      cron_schedule,
    };
    const response = await axios.post(`${BASE_URL}/api/backup/add`, payload);
    console.log('Backup added successfully:', response.data);

    return response.data["storage_repositories"];
  } catch (error) {
    console.error('Failed to add backup:', error);
    return []; 
  }
}

export async function delete_backup(backup_id) {
  try {
      console.log('Using backend API:', BASE_URL)
      const response = await axios.delete(`${BASE_URL}/api/backup/delete/${backup_id}`)
      console.log('Fetched hosts:', response)
      return response.data
  } catch (error) {
      console.error('Failed to fetch hosts:', error)
      return []
  }
}